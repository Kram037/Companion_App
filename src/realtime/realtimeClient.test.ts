import { describe, expect, it } from 'vitest';

import {
  processRealtimeEvent,
  realtimeClientId,
  realtimeQueryPrefixes,
  realtimeEventKey,
  shouldProcessRealtimeEvent,
} from './realtimeClient';

describe('realtimeClient', () => {
  it('builds deterministic event keys', () => {
    expect(realtimeEventKey({ table: 'sessioni', action: 'update', id: 's1' })).toBe('sessioni:update:s1');
    expect(realtimeEventKey({ table: 'sessioni', action: 'update', id: 's1', eventId: 'event-1' })).toBe('sessioni:update:event-1');
    expect(realtimeEventKey({ table: 'sessioni', action: 'update', eventId: 'event-1' })).toBe('sessioni:update:event-1');
  });

  it('deduplicates repeated events inside the dedupe window', () => {
    const event = { table: 'sessioni', action: 'update', id: `s-${Date.now()}` };

    expect(shouldProcessRealtimeEvent(event, 10_000)).toBe(true);
    expect(shouldProcessRealtimeEvent(event, 10_500)).toBe(false);
    expect(shouldProcessRealtimeEvent(event, 13_500)).toBe(true);
  });

  it('does not collapse distinct updates to the same row', () => {
    const id = `same-row-${Date.now()}`;
    expect(shouldProcessRealtimeEvent({ table: 'sessioni', action: 'update', id, eventId: `${id}-1` }, 20_000)).toBe(true);
    expect(shouldProcessRealtimeEvent({ table: 'sessioni', action: 'update', id, eventId: `${id}-2` }, 20_100)).toBe(true);
  });

  it('ignores events echoed by the same browser client', () => {
    expect(processRealtimeEvent({
      table: 'sessioni',
      action: 'update',
      eventId: `own-${Date.now()}`,
      sourceClientId: realtimeClientId,
    })).toBe(false);
  });

  it('maps realtime tables to targeted query prefixes', () => {
    expect(realtimeQueryPrefixes({ table: 'sessioni', action: 'update', campagnaId: 'c1', sessioneId: 's1' })).toEqual([
      ['campaigns', 'detail', 'c1'],
      ['combat', 's1'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'campagne', action: 'delete', campagnaId: 'c1' })).toEqual([
      ['campaigns'],
      ['combat'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'personaggi', action: 'update', personaggioId: 'p1' })).toEqual([
      ['character', 'p1'],
      ['characters'],
      ['campaigns'],
      ['combat'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'personaggi', action: 'update', id: 'p2' })).toEqual([
      ['character', 'p2'],
      ['characters'],
      ['campaigns'],
      ['combat'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'mostri_combattimento', action: 'update', sessioneId: 's1' })).toEqual([
      ['combat', 's1'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'homebrew_oggetti', action: 'insert' })).toEqual([['homebrew']]);
    expect(realtimeQueryPrefixes({ table: 'richieste_amicizia', action: 'update' })).toEqual([['friends']]);
    expect(realtimeQueryPrefixes({ table: 'unknown', action: 'update' })).toEqual([]);
  });
});
