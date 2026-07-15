import type { Id } from '../types/domain';
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

export async function fetchFriendsSnapshot(): Promise<FriendsSnapshot> {
  const client = getSupabaseClient();
  const [friends, incoming, outgoing] = await Promise.all([
    client.rpc('get_amici'),
    client.rpc('get_richieste_in_entrata'),
    client.rpc('get_richieste_in_uscita'),
  ]);

  throwIfSupabaseError(friends.error);
  throwIfSupabaseError(incoming.error);
  throwIfSupabaseError(outgoing.error);

  return {
    friends: (friends.data ?? []).map(row => ({
      id: String(row.amico_id),
      name: String(row.nome_utente || 'Utente'),
      cid: String(row.cid ?? ''),
    })),
    incoming: (incoming.data ?? []).map(row => ({
      id: String(row.richiesta_id),
      user: {
        id: String(row.richiedente_id),
        name: String(row.nome_utente || 'Utente'),
        cid: String(row.cid ?? ''),
      },
    })),
    outgoing: (outgoing.data ?? []).map(row => ({
      id: String(row.richiesta_id),
      user: {
        id: String(row.destinatario_id),
        name: String(row.nome_utente || 'Utente'),
        cid: String(row.cid ?? ''),
      },
    })),
  };
}

export async function updateFriendRequest(requestId: Id, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('richieste_amicizia')
    .update({ stato: status })
    .eq('id', requestId);
  throwIfSupabaseError(error);
}

export async function removeFriend(currentUserId: Id, friendId: Id): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('richieste_amicizia')
    .delete()
    .eq('stato', 'accepted')
    .or(`and(richiedente_id.eq.${currentUserId},destinatario_id.eq.${friendId}),and(richiedente_id.eq.${friendId},destinatario_id.eq.${currentUserId})`);
  throwIfSupabaseError(error);
}
