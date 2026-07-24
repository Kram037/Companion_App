import type { QueryKey } from '@tanstack/react-query';
import { queryClient, queryKeys } from '../query';

export interface RealtimeEventMeta {
  table: string;
  action: string;
  id?: string | number | null;
  eventId?: string | null;
  sourceClientId?: string | null;
  timestamp?: number | string | null;
}

export interface RealtimeDataChange extends RealtimeEventMeta {
  campagnaId?: string | null;
  sessioneId?: string | null;
  personaggioId?: string | null;
  userId?: string | null;
  requestId?: string | null;
}

const DEDUPE_MS = 3000;
const recentEvents = new Map<string, number>();

export const realtimeClientId = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random()}`;

export function realtimeEventKey(event: RealtimeDataChange): string {
  const scope = [event.eventId, event.id, event.requestId, event.sessioneId, event.campagnaId, event.personaggioId, event.userId]
    .find(value => value != null && value !== '');
  return `${event.table}:${event.action}:${scope ?? ''}`;
}

export function shouldProcessRealtimeEvent(event: RealtimeDataChange, now = Date.now()): boolean {
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

export function realtimeQueryPrefixes(event: RealtimeDataChange): QueryKey[] {
  const table = event.table || '';
  if (table.startsWith('homebrew_')) return [event.userId ? queryKeys.homebrew(event.userId) : ['homebrew']];
  if (['campagne', 'inviti_campagna', 'richieste_campagna'].includes(table)) {
    return event.campagnaId ? [['campaigns'], ['combat']] : [['campaigns']];
  }
  if (['personaggi', 'personaggi_campagna'].includes(table)) {
    const personaggioId = event.personaggioId
      ?? (table === 'personaggi' && event.id != null ? String(event.id) : null);
    const prefixes: QueryKey[] = [['characters'], ['campaigns'], ['combat']];
    if (personaggioId) prefixes.unshift(queryKeys.character(personaggioId));
    return prefixes;
  }
  if (table === 'sessioni') {
    const prefixes: QueryKey[] = [event.campagnaId ? queryKeys.campaign(event.campagnaId) : ['campaigns']];
    if (event.sessioneId) prefixes.push(queryKeys.combat(event.sessioneId));
    return prefixes;
  }
  if (['combattimento', 'mostri_combattimento', 'iniziativa', 'richieste_tiro_iniziativa', 'richieste_tiro_generico', 'combat_timers'].includes(table)) {
    return [event.sessioneId ? queryKeys.combat(event.sessioneId) : ['combat']];
  }
  if (['utenti', 'richieste_amicizia'].includes(table)) {
    return [event.userId ? queryKeys.friends(event.userId) : ['friends']];
  }
  return [];
}

export function invalidateRealtimeEvent(event: RealtimeDataChange): void {
  for (const queryKey of realtimeQueryPrefixes(event)) {
    queryClient.invalidateQueries({ queryKey });
  }
}

export function processRealtimeEvent(event: RealtimeDataChange): boolean {
  if (!event.table || !event.action || !shouldProcessRealtimeEvent(event)) return false;
  invalidateRealtimeEvent(event);
  return true;
}
