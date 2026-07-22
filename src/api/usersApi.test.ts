import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
  isMissingDatabaseColumn: vi.fn(() => false),
  throwIfSupabaseError: vi.fn(),
}));

import { subscribeToCurrentUser } from './usersApi';

describe('subscribeToCurrentUser', () => {
  let authListener: (() => void) | undefined;
  let unsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    unsubscribe = vi.fn();
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        onAuthStateChange: vi.fn((listener: () => void) => {
          authListener = listener;
          return { data: { subscription: { unsubscribe } } };
        }),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    authListener = undefined;
  });

  it('defers query invalidation until the Supabase auth callback has returned', async () => {
    const callback = vi.fn();
    const dispose = subscribeToCurrentUser(callback);

    authListener?.();
    expect(callback).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledOnce();

    dispose();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('cancels pending invalidation when the subscription is disposed', async () => {
    const callback = vi.fn();
    const dispose = subscribeToCurrentUser(callback);

    authListener?.();
    dispose();
    await vi.runAllTimersAsync();

    expect(callback).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
