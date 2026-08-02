import { z } from 'zod';

import type { Campagna, CampaignCharacter, CampaignInvite, CampaignPlayer, Id } from '../types/domain';
import { campaignCharacterSchema, campaignInviteSchema, campaignPlayerSchema, campaignSchema, parseArray, parseData, parseNullable } from '../schemas';
import { dbRpc, dbTables } from './databaseContract';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

const CAMPAIGN_COLUMNS = 'id,nome_campagna,id_dm,icona_name,giocatori,data_creazione,numero_sessioni,tempo_di_gioco,note,updated_at';
const campaignDmSchema = z.object({
  id: z.string(),
  nome_utente: z.string().nullish(),
  cid: z.union([z.string(), z.number().transform(String)]).nullish(),
});
const campaignFavoritesSchema = z.object({
  campagne_preferite: z.array(z.string()).nullish(),
});

export async function fetchCampaignById(campagnaId: Id): Promise<Campagna | null> {
  const [campaignResult, dmResult] = await Promise.all([
    getSupabaseClient().from(dbTables.campaigns).select(CAMPAIGN_COLUMNS).eq('id', campagnaId).single(),
    getSupabaseClient().rpc(dbRpc.getCampaignDm, { p_campagna_id: campagnaId }),
  ]);
  const { data, error } = campaignResult;
  throwIfSupabaseError(error);
  throwIfSupabaseError(dmResult.error);
  const campaign = parseNullable(campaignSchema, data);
  if (!campaign) return null;
  const dm = parseArray(campaignDmSchema, dmResult.data)[0] ?? null;
  return { ...campaign, dm_nome: dm?.nome_utente ?? null };
}

export async function fetchCampaignPlayers(campagnaId: Id): Promise<CampaignPlayer[]> {
  const { data, error } = await getSupabaseClient().rpc(dbRpc.getCampaignPlayers, {
    campagna_id_param: campagnaId,
  });
  throwIfSupabaseError(error);
  return parseArray(campaignPlayerSchema, data);
}

export async function fetchCampaignCharacters(campagnaId: Id): Promise<CampaignCharacter[]> {
  const { data, error } = await getSupabaseClient().rpc(dbRpc.getCampaignCharacters, {
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
    getSupabaseClient().from(dbTables.campaigns).select(CAMPAIGN_COLUMNS).order('data_creazione', { ascending: false }),
    getSupabaseClient().from(dbTables.users).select('campagne_preferite').eq('id', userTableId).single(),
  ]);
  throwIfSupabaseError(visible.error);
  throwIfSupabaseError(user.error);
  const campaigns = parseArray(campaignSchema, visible.data);
  const dmIds = [...new Set(campaigns.map(campaign => campaign.id_dm))];
  const { data: dms, error: dmsError } = dmIds.length
    ? await getSupabaseClient().rpc(dbRpc.getCampaignDms, { p_dm_ids: dmIds })
    : { data: [], error: null };
  throwIfSupabaseError(dmsError);

  const favoriteIds = new Set<Id>(parseData(campaignFavoritesSchema, user.data).campagne_preferite ?? []);
  const dmNames = new Map<Id, string>(parseArray(campaignDmSchema, dms).map(dm => [
    dm.id,
    dm.nome_utente ?? '',
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
    .from(dbTables.users)
    .select('campagne_preferite')
    .eq('id', userTableId)
    .single();
  throwIfSupabaseError(error);

  const favorites = new Set<Id>(parseData(campaignFavoritesSchema, data).campagne_preferite ?? []);
  if (favorites.has(campaignId)) favorites.delete(campaignId);
  else favorites.add(campaignId);

  const next = [...favorites];
  const { error: updateError } = await client
    .from(dbTables.users)
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
    .rpc(dbRpc.getReceivedCampaignInvites, { p_invitato_id: userTableId });
  throwIfSupabaseError(error);
  return (data ?? []).map((row: Record<string, unknown>) => mapReceivedCampaignInviteRow(row));
}

export async function updateCampaignInviteStatus(inviteId: Id, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc(status === 'accepted' ? dbRpc.acceptCampaignInvite : dbRpc.rejectCampaignInvite, {
      p_invito_id: inviteId,
    });
  throwIfSupabaseError(error);
}

