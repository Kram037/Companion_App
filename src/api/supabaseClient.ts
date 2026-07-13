type SupabaseClientLike = {
  from(table: string): any;
  rpc(functionName: string, args?: Record<string, unknown>): any;
  auth?: any;
  channel?: any;
  removeChannel?: any;
};

declare global {
  interface Window {
    supabaseClient?: SupabaseClientLike;
  }
}

export function getSupabaseClient(): SupabaseClientLike {
  const client = window.supabaseClient;
  if (!client) throw new Error('Supabase client non disponibile');
  return client;
}

export function throwIfSupabaseError(error: unknown): void {
  if (error) throw error;
}
