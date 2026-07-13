import type { QueryKey } from '@tanstack/react-query';
import { queryClient } from '../query';

export const realtimeChannels = {
  auth: 'auth-session',
  campaigns: 'campaigns',
  sessions: 'sessions',
  combat: 'combat',
  rollRequests: 'roll-requests',
  notifications: 'notifications',
} as const;

export type RealtimeAction =
  | { type: 'invalidate'; queryKey: QueryKey }
  | { type: 'patch'; queryKey: QueryKey; updater: (current: unknown) => unknown }
  | { type: 'notify'; message: string }
  | { type: 'none' };

export interface RealtimeEventMeta {
  table: string;
  action: string;
  id?: string | number | null;
  sourceClientId?: string | null;
  timestamp?: number | string | null;
}

export interface RealtimeDataChange extends RealtimeEventMeta {
  campagnaId?: string | null;
  sessioneId?: string | null;
  personaggioId?: string | null;
  userId?: string | null;
}

const DEDUPE_MS = 3000;
const recentEvents = new Map<string, number>();
let notifyHandler: ((message: string) => void) | null = null;

export const realtimeClientId = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random()}`;

export function setRealtimeNotifyHandler(handler: ((message: string) => void) | null): void {
  notifyHandler = handler;
}

export function realtimeEventKey(event: RealtimeEventMeta): string {
  return `${event.table}:${event.action}:${event.id ?? ''}`;
}

export function shouldProcessRealtimeEvent(event: RealtimeEventMeta, now = Date.now()): boolean {
  if (event.sourceClientId && event.sourceClientId === realtimeClientId) return false;

  const key = realtimeEventKey(event);
  const lastSeen = recentEvents.get(key);
  if (lastSeen && now - lastSeen < DEDUPE_MS) return false;

  recentEvents.set(key, now);
  for (const [eventKey, seenAt] of recentEvents) {
    if (now - seenAt > DEDUPE_MS) recentEvents.delete(eventKey);
  }
  return true;
}

export function applyRealtimeAction(action: RealtimeAction): void {
  if (action.type === 'invalidate') {
    queryClient.invalidateQueries({ queryKey: action.queryKey });
    return;
  }
  if (action.type === 'patch') {
    queryClient.setQueryData(action.queryKey, action.updater);
    return;
  }
  if (action.type === 'notify') {
    notifyHandler?.(action.message);
  }
}

export function realtimeQueryPrefixes(event: RealtimeDataChange): QueryKey[] {
  const table = event.table || '';
  if (table.startsWith('homebrew_')) return [['homebrew']];
  if (['campagne', 'inviti_campagna', 'richieste_campagna'].includes(table)) {
    return [['campaigns'], ['campaignInvites'], ['campaign']];
  }
  if (['personaggi', 'personaggi_campagna'].includes(table)) {
    return [['characters'], ['character'], ['campaign']];
  }
  if (table === 'sessioni') {
    return [['session'], ['campaign'], ['campaigns'], ['combat']];
  }
  if (['combattimento', 'mostri_combattimento', 'iniziativa', 'richieste_tiro_iniziativa', 'richieste_tiro_generico', 'combat_timers'].includes(table)) {
    return [['combat'], ['session']];
  }
  if (['utenti', 'richieste_amicizia'].includes(table)) {
    return [['currentUser'], ['campaigns'], ['homebrew']];
  }
  return [];
}

export function invalidateRealtimeEvent(event: RealtimeDataChange): void {
  for (const queryKey of realtimeQueryPrefixes(event)) {
    queryClient.invalidateQueries({ queryKey });
  }
}
