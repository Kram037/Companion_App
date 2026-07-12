import { describe, expect, it } from 'vitest';

import {
  applyRealtimeAction,
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
});
