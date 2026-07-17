import type { Campagna, CampaignCharacter, CampaignInvite, CampaignPlayer, Id } from '../types/domain';
import { campaignInviteSchema, campaignSchema, parseArray, parseNullable } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export async function fetchCampaignById(campagnaId: Id): Promise<Campagna | null> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id', campagnaId)
    .single();
  throwIfSupabaseError(error);
  const campaign = parseNullable(campaignSchema, data);
  if (!campaign) return null;
  const { data: dm, error: dmError } = await getSupabaseClient()
    .from('utenti')
    .select('nome_utente')
    .eq('id', campaign.id_dm)
    .maybeSingle();
  throwIfSupabaseError(dmError);
  return { ...campaign, dm_nome: dm?.nome_utente ? String(dm.nome_utente) : null };
}

export async function fetchCampaignPlayers(campagnaId: Id): Promise<CampaignPlayer[]> {
  const { data, error } = await getSupabaseClient().rpc('get_giocatori_campagna', {
    campagna_id_param: campagnaId,
  });
  throwIfSupabaseError(error);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    nome_utente: row.nome_utente ? String(row.nome_utente) : null,
    cid: row.cid ? String(row.cid) : null,
  }));
}

export async function fetchCampaignCharacters(campagnaId: Id): Promise<CampaignCharacter[]> {
  const { data, error } = await getSupabaseClient().rpc('get_personaggi_in_campagna', {
    p_campagna_id: campagnaId,
  });
  throwIfSupabaseError(error);
  return (data ?? []).filter((row: Record<string, unknown>) => row.personaggio_id).map((row: Record<string, unknown>) => ({
    id: String(row.personaggio_id),
    nome: String(row.nome ?? '?'),
    player_user_id: row.player_user_id ? String(row.player_user_id) : null,
  }));
}

export async function fetchCampaignsByDm(dmId: Id): Promise<Campagna[]> {
  const { data, error } = await getSupabaseClient()
    .from('campagne')
    .select('*')
    .eq('id_dm', dmId)
    .order('data_creazione', { ascending: false });
  throwIfSupabaseError(error);
  return parseArray(campaignSchema, data);
}

export async function fetchAcceptedCampaignsByPlayer(userTableId: Id): Promise<Campagna[]> {
  const { data, error } = await getSupabaseClient()
    .from('inviti_campagna')
    .select('campagne:campagne!inviti_campagna_campagna_id_fkey(*)')
    .eq('invitato_id', userTableId)
    .eq('stato', 'accepted');
  throwIfSupabaseError(error);

  return parseArray(
    campaignSchema,
    (data ?? []).map(row => row.campagne).filter(Boolean),
  );
}

export async function fetchVisibleCampaigns(userTableId: Id): Promise<Campagna[]> {
  const [owned, joined, user] = await Promise.all([
    fetchCampaignsByDm(userTableId),
    fetchAcceptedCampaignsByPlayer(userTableId),
    getSupabaseClient().from('utenti').select('campagne_preferite').eq('id', userTableId).single(),
  ]);

  const byId = new Map<Id, Campagna>();
  [...owned, ...joined].forEach(campaign => byId.set(campaign.id, campaign));
  const campaigns = Array.from(byId.values());
  const dmIds = [...new Set(campaigns.map(campaign => campaign.id_dm))];
  const { data: dms, error: dmsError } = dmIds.length
    ? await getSupabaseClient().from('utenti').select('id,nome_utente').in('id', dmIds)
    : { data: [], error: null };
  throwIfSupabaseError(user.error);
  throwIfSupabaseError(dmsError);

  const favoriteIds = new Set<Id>(user.data?.campagne_preferite ?? []);
  const dmNames = new Map<Id, string>((dms ?? []).map(dm => [String(dm.id), String(dm.nome_utente ?? '')]));
  return campaigns.map(campaign => ({
    ...campaign,
    dm_nome: dmNames.get(campaign.id_dm) ?? null,
    isPreferito: favoriteIds.has(campaign.id),
  })).sort((a, b) => {
    return new Date(b.data_creazione ?? b.created_at ?? 0).getTime()
      - new Date(a.data_creazione ?? a.created_at ?? 0).getTime();
  });
}

export async function toggleCampaignFavorite(userTableId: Id, campaignId: Id): Promise<Id[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('utenti')
    .select('campagne_preferite')
    .eq('id', userTableId)
    .single();
  throwIfSupabaseError(error);

  const favorites = new Set<Id>(data?.campagne_preferite ?? []);
  if (favorites.has(campaignId)) favorites.delete(campaignId);
  else favorites.add(campaignId);

  const next = [...favorites];
  const { error: updateError } = await client
    .from('utenti')
    .update({ campagne_preferite: next })
    .eq('id', userTableId);
  throwIfSupabaseError(updateError);
  return next;
}

export function mapReceivedCampaignInviteRow(row: Record<string, unknown>): CampaignInvite {
  return campaignInviteSchema.parse({
    id: row.id,
    campagna_id: row.campagna_id,
    inviante_id: row.inviante_id,
    invitato_id: row.invitato_id,
    stato: row.stato,
    created_at: row.created_at,
    updated_at: row.updated_at,
    campagna: row.campagna_nome_campagna ? {
      id: row.campagna_id,
      nome_campagna: row.campagna_nome_campagna,
    } : null,
    inviante: row.inviante_nome_utente ? {
      id: row.inviante_id,
      nome_utente: row.inviante_nome_utente,
      cid: row.inviante_cid,
    } : null,
  });
}

export async function fetchReceivedCampaignInvites(userTableId: Id): Promise<CampaignInvite[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('get_inviti_ricevuti', { p_invitato_id: userTableId });
  throwIfSupabaseError(error);
  return (data ?? []).map((row: Record<string, unknown>) => mapReceivedCampaignInviteRow(row));
}

export async function updateCampaignInviteStatus(inviteId: Id, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('update_invito_campagna_stato', {
      p_invito_id: inviteId,
      p_nuovo_stato: status,
    });
  throwIfSupabaseError(error);
}

