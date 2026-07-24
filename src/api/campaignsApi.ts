import type { Campagna, CampaignCharacter, CampaignInvite, CampaignPlayer, Id } from '../types/domain';
import { campaignCharacterSchema, campaignInviteSchema, campaignPlayerSchema, campaignSchema, parseArray, parseNullable } from '../schemas';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

const CAMPAIGN_COLUMNS = 'id,nome_campagna,id_dm,icona_name,giocatori,data_creazione,numero_sessioni,tempo_di_gioco,note,updated_at';

export async function fetchCampaignById(campagnaId: Id): Promise<Campagna | null> {
  const [campaignResult, dmResult] = await Promise.all([
    getSupabaseClient().from('campagne').select(CAMPAIGN_COLUMNS).eq('id', campagnaId).single(),
    getSupabaseClient().rpc('get_dm_campagna', { p_campagna_id: campagnaId }),
  ]);
  const { data, error } = campaignResult;
  throwIfSupabaseError(error);
  throwIfSupabaseError(dmResult.error);
  const campaign = parseNullable(campaignSchema, data);
  if (!campaign) return null;
  const dm = Array.isArray(dmResult.data) ? dmResult.data[0] : null;
  return { ...campaign, dm_nome: dm?.nome_utente ? String(dm.nome_utente) : null };
}

export async function fetchCampaignPlayers(campagnaId: Id): Promise<CampaignPlayer[]> {
  const { data, error } = await getSupabaseClient().rpc('get_giocatori_campagna', {
    campagna_id_param: campagnaId,
  });
  throwIfSupabaseError(error);
  return parseArray(campaignPlayerSchema, data);
}

export async function fetchCampaignCharacters(campagnaId: Id): Promise<CampaignCharacter[]> {
  const { data, error } = await getSupabaseClient().rpc('get_personaggi_in_campagna', {
    p_campagna_id: campagnaId,
  });
  throwIfSupabaseError(error);
  return parseArray(campaignCharacterSchema, data).map(row => ({
    id: row.personaggio_id,
    nome: row.nome ?? '?',
    player_user_id: row.player_user_id,
  }));
}

export async function fetchVisibleCampaigns(userTableId: Id): Promise<Campagna[]> {
  const [visible, user] = await Promise.all([
    getSupabaseClient().from('campagne').select(CAMPAIGN_COLUMNS).order('data_creazione', { ascending: false }),
    getSupabaseClient().from('utenti').select('campagne_preferite').eq('id', userTableId).single(),
  ]);
  throwIfSupabaseError(visible.error);
  throwIfSupabaseError(user.error);
  const campaigns = parseArray(campaignSchema, visible.data);
  const dmIds = [...new Set(campaigns.map(campaign => campaign.id_dm))];
  const { data: dms, error: dmsError } = dmIds.length
    ? await getSupabaseClient().rpc('get_dms_campagne', { p_dm_ids: dmIds })
    : { data: [], error: null };
  throwIfSupabaseError(dmsError);

  const favoriteIds = new Set<Id>(user.data?.campagne_preferite ?? []);
  const dmNames = new Map<Id, string>((dms ?? []).map((dm: Record<string, unknown>) => [
    String(dm.id),
    String(dm.nome_utente ?? ''),
  ]));
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
    .rpc(status === 'accepted' ? 'accetta_invito_campagna' : 'rifiuta_invito_campagna', {
      p_invito_id: inviteId,
    });
  throwIfSupabaseError(error);
}

