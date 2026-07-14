import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    CompanionConfig?: { supabaseUrl?: string; supabaseAnonKey?: string; debug?: boolean };
    supabaseClient?: SupabaseClient;
    supabaseCreateClient?: typeof createClient;
  }
}

export function initializeSupabaseClient(): SupabaseClient | null {
  if (window.supabaseClient) return window.supabaseClient;
  const { supabaseUrl, supabaseAnonKey, debug } = window.CompanionConfig ?? {};
  if (!supabaseUrl || !supabaseAnonKey) return null;

  window.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  window.supabaseCreateClient = createClient;
  if (debug) console.log('Supabase caricato e inizializzato');
  return window.supabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  const client = window.supabaseClient;
  if (!client) throw new Error('Supabase client non disponibile');
  return client;
}

export function throwIfSupabaseError(error: unknown): void {
  if (error) throw error;
}
