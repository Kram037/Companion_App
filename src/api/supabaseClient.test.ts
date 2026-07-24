import { describe, expect, it } from 'vitest';

import { isMissingDatabaseColumn, throwIfSupabaseError } from './supabaseClient';

describe('isMissingDatabaseColumn', () => {
  it('only accepts PostgreSQL and PostgREST missing-column errors', () => {
    expect(isMissingDatabaseColumn({ code: '42703' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: 'PGRST204' })).toBe(true);
    expect(isMissingDatabaseColumn({ message: 'column foo does not exist' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: '42501', message: 'permission denied' })).toBe(false);
  });
});

describe('throwIfSupabaseError', () => {
  it('preserves the message from Supabase error objects', () => {
    expect(() => throwIfSupabaseError({
      code: 'PGRST202',
      message: 'Could not find the function start_campaign_session',
    })).toThrow('Could not find the function start_campaign_session');
  });
});
