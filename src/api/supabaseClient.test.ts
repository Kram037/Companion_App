import { describe, expect, it } from 'vitest';

import {
  DataAccessError,
  isMissingDatabaseColumn,
  normalizeSupabaseError,
  throwIfSupabaseError,
} from './supabaseClient';

describe('isMissingDatabaseColumn', () => {
  it('only accepts PostgreSQL and PostgREST missing-column errors', () => {
    expect(isMissingDatabaseColumn({ code: '42703' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: 'PGRST204' })).toBe(true);
    expect(isMissingDatabaseColumn({ message: 'column foo does not exist' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: '42501', message: 'permission denied' })).toBe(false);
  });
});

describe('throwIfSupabaseError', () => {
  it('normalizes Supabase errors while preserving their message and code', () => {
    const error = normalizeSupabaseError({
      code: 'PGRST202',
      message: 'Could not find the function start_campaign_session',
    });

    expect(error).toBeInstanceOf(DataAccessError);
    expect(error).toMatchObject({
      code: 'PGRST202',
      kind: 'unknown',
      retryable: false,
      message: 'Could not find the function start_campaign_session',
    });
    expect(() => throwIfSupabaseError(error)).toThrow(error);
  });

  it('classifies permission, conflict and network failures consistently', () => {
    expect(normalizeSupabaseError({ code: '42501', message: 'permission denied' })).toMatchObject({
      kind: 'authorization',
      retryable: false,
    });
    expect(normalizeSupabaseError({ code: '23505', message: 'duplicate key' })).toMatchObject({
      kind: 'conflict',
      retryable: false,
    });
    expect(normalizeSupabaseError(new TypeError('Failed to fetch'))).toMatchObject({
      kind: 'network',
      retryable: true,
    });
  });
});
