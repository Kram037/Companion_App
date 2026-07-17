import { describe, expect, it } from 'vitest';

import { isMissingDatabaseColumn } from './supabaseClient';

describe('isMissingDatabaseColumn', () => {
  it('only accepts PostgreSQL and PostgREST missing-column errors', () => {
    expect(isMissingDatabaseColumn({ code: '42703' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: 'PGRST204' })).toBe(true);
    expect(isMissingDatabaseColumn({ message: 'column foo does not exist' })).toBe(true);
    expect(isMissingDatabaseColumn({ code: '42501', message: 'permission denied' })).toBe(false);
  });
});
