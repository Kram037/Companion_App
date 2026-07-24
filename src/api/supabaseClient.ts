import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    CompanionConfig?: { supabaseUrl?: string; supabaseAnonKey?: string; debug?: boolean };
    supabaseClient?: SupabaseClient;
    initializeSupabaseClient?: () => SupabaseClient | null;
  }
}

export function initializeSupabaseClient(): SupabaseClient | null {
  if (window.supabaseClient) return window.supabaseClient;
  const { supabaseUrl, supabaseAnonKey, debug } = window.CompanionConfig ?? {};
  if (!supabaseUrl || !supabaseAnonKey) return null;

  window.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  window.dispatchEvent(new Event('companion:supabase-ready'));
  if (debug) console.log('Supabase caricato e inizializzato');
  return window.supabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  const client = window.supabaseClient;
  if (!client) throw new Error('Supabase client non disponibile');
  return client;
}

export function throwIfSupabaseError(error: unknown): void {
  if (!error) return;
  if (error instanceof Error) throw error;
  if (typeof error === 'object' && 'message' in error) {
    throw new Error(String((error as { message: unknown }).message), { cause: error });
  }
  throw new Error(String(error));
}

export function isMissingDatabaseColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === '42703'
    || code === 'PGRST204'
    || /column .* does not exist|schema cache/i.test(String(message ?? ''));
}

if (typeof window !== 'undefined') {
  window.initializeSupabaseClient = initializeSupabaseClient;
}
