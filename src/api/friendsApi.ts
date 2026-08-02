import { z } from 'zod';

import { parseArray, parseData } from '../schemas';
import type { Id } from '../types/domain';
import { dbRpc, dbTables } from './databaseContract';
import { getSupabaseClient, throwIfSupabaseError } from './supabaseClient';

export interface FriendProfile {
  id: Id;
  name: string;
  cid: string;
}

export interface FriendRequest {
  id: Id;
  user: FriendProfile;
}

export interface FriendsSnapshot {
  friends: FriendProfile[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

const friendProfileRowSchema = z.object({
  amico_id: z.string().min(1),
  nome_utente: z.string().nullish(),
  cid: z.union([z.string(), z.number().transform(String)]).nullish(),
});
const incomingFriendRequestRowSchema = z.object({
  richiesta_id: z.string().min(1),
  richiedente_id: z.string().min(1),
  nome_utente: z.string().nullish(),
  cid: z.union([z.string(), z.number().transform(String)]).nullish(),
});
const outgoingFriendRequestRowSchema = z.object({
  richiesta_id: z.string().min(1),
  destinatario_id: z.string().min(1),
  nome_utente: z.string().nullish(),
  cid: z.union([z.string(), z.number().transform(String)]).nullish(),
});

export function mapFriendProfileRow(row: unknown): FriendProfile {
  const parsed = parseData(friendProfileRowSchema, row);
  return {
    id: parsed.amico_id,
    name: parsed.nome_utente || 'Utente',
    cid: parsed.cid ?? '',
  };
}

export function parseFriendProfileRows(value: unknown): FriendProfile[] {
  return parseArray(friendProfileRowSchema, value).map(row => ({
    id: row.amico_id,
    name: row.nome_utente || 'Utente',
    cid: row.cid ?? '',
  }));
}

export function mapIncomingFriendRequestRow(row: unknown): FriendRequest {
  const parsed = parseData(incomingFriendRequestRowSchema, row);
  return {
    id: parsed.richiesta_id,
    user: {
      id: parsed.richiedente_id,
      name: parsed.nome_utente || 'Utente',
      cid: parsed.cid ?? '',
    },
  };
}

export function mapOutgoingFriendRequestRow(row: unknown): FriendRequest {
  const parsed = parseData(outgoingFriendRequestRowSchema, row);
  return {
    id: parsed.richiesta_id,
    user: {
      id: parsed.destinatario_id,
      name: parsed.nome_utente || 'Utente',
      cid: parsed.cid ?? '',
    },
  };
}

export async function fetchFriendsSnapshot(): Promise<FriendsSnapshot> {
  const client = getSupabaseClient();
  const [friends, incoming, outgoing] = await Promise.all([
    client.rpc(dbRpc.getFriends),
    client.rpc(dbRpc.getIncomingFriendRequests),
    client.rpc(dbRpc.getOutgoingFriendRequests),
  ]);

  throwIfSupabaseError(friends.error);
  throwIfSupabaseError(incoming.error);
  throwIfSupabaseError(outgoing.error);

  return {
    friends: parseFriendProfileRows(friends.data),
    incoming: parseArray(incomingFriendRequestRowSchema, incoming.data).map(mapIncomingFriendRequestRow),
    outgoing: parseArray(outgoingFriendRequestRowSchema, outgoing.data).map(mapOutgoingFriendRequestRow),
  };
}

export async function updateFriendRequest(requestId: Id, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(dbTables.friendRequests)
    .update({ stato: status })
    .eq('id', requestId);
  throwIfSupabaseError(error);
}

export async function removeFriend(currentUserId: Id, friendId: Id): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(dbTables.friendRequests)
    .delete()
    .eq('stato', 'accepted')
    .or(`and(richiedente_id.eq.${currentUserId},destinatario_id.eq.${friendId}),and(richiedente_id.eq.${friendId},destinatario_id.eq.${currentUserId})`);
  throwIfSupabaseError(error);
}
