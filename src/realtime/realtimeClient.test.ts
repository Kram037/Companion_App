import { describe, expect, it } from 'vitest';

import {
  applyRealtimeAction,
  realtimeQueryPrefixes,
  realtimeEventKey,
  setRealtimeNotifyHandler,
  shouldProcessRealtimeEvent,
} from './realtimeClient';

describe('realtimeClient', () => {
  it('builds deterministic event keys', () => {
    expect(realtimeEventKey({ table: 'sessioni', action: 'update', id: 's1' })).toBe('sessioni:update:s1');
  });

  it('deduplicates repeated events inside the dedupe window', () => {
    const event = { table: 'sessioni', action: 'update', id: `s-${Date.now()}` };

    expect(shouldProcessRealtimeEvent(event, 10_000)).toBe(true);
    expect(shouldProcessRealtimeEvent(event, 10_500)).toBe(false);
    expect(shouldProcessRealtimeEvent(event, 13_500)).toBe(true);
  });

  it('dispatches transient notifications through an injected handler', () => {
    const messages: string[] = [];

    setRealtimeNotifyHandler(message => messages.push(message));
    applyRealtimeAction({ type: 'notify', message: 'Nuovo evento' });
    setRealtimeNotifyHandler(null);

    expect(messages).toEqual(['Nuovo evento']);
  });

  it('maps realtime tables to targeted query prefixes', () => {
    expect(realtimeQueryPrefixes({ table: 'sessioni', action: 'update' })).toEqual([
      ['session'], ['campaign'], ['campaigns'], ['combat'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'homebrew_oggetti', action: 'insert' })).toEqual([['homebrew']]);
    expect(realtimeQueryPrefixes({ table: 'richieste_amicizia', action: 'update' })).toEqual([
      ['currentUser'], ['friends'], ['campaigns'], ['homebrew'],
    ]);
    expect(realtimeQueryPrefixes({ table: 'unknown', action: 'update' })).toEqual([]);
  });
});
