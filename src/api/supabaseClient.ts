import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type DataAccessErrorKind =
  | 'authentication'
  | 'authorization'
  | 'conflict'
  | 'not_found'
  | 'network'
  | 'validation'
  | 'unknown';

interface DataAccessErrorOptions {
  kind: DataAccessErrorKind;
  code?: string | null;
  status?: number | null;
  retryable?: boolean;
  cause?: unknown;
}

export class DataAccessError extends Error {
  readonly kind: DataAccessErrorKind;
  readonly code: string | null;
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, options: DataAccessErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'DataAccessError';
    this.kind = options.kind;
    this.code = options.code ?? null;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }
}

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

export function normalizeSupabaseError(error: unknown): DataAccessError {
  if (error instanceof DataAccessError) return error;

  const details = error != null && typeof error === 'object'
    ? error as { code?: unknown; message?: unknown; status?: unknown }
    : {};
  const code = details.code == null ? null : String(details.code);
  const parsedStatus = Number(details.status);
  const status = Number.isInteger(parsedStatus) ? parsedStatus : null;
  const rawMessage = error instanceof Error ? error.message : details.message ?? error;
  const message = String(rawMessage || 'Operazione dati non riuscita');
  const normalized = message.toLocaleLowerCase('it');

  let kind: DataAccessErrorKind = 'unknown';
  if (status === 401 || code === 'PGRST301' || /jwt|sessione.*scadut|not authenticated/.test(normalized)) {
    kind = 'authentication';
  } else if (status === 403 || code === '42501' || /permission denied|non autorizzat/.test(normalized)) {
    kind = 'authorization';
  } else if (status === 404 || code === 'PGRST116') {
    kind = 'not_found';
  } else if (status === 409 || code === '23505' || code === '23503' || code === '23P01') {
    kind = 'conflict';
  } else if (error instanceof TypeError || /failed to fetch|network|connessione/.test(normalized)) {
    kind = 'network';
  } else if (status === 400 || code?.startsWith('22')) {
    kind = 'validation';
  }

  const retryable = kind === 'network'
    || (status != null && status >= 500)
    || ['PGRST000', 'PGRST001', 'PGRST002'].includes(code ?? '');
  return new DataAccessError(message, { kind, code, status, retryable, cause: error });
}

export function throwIfSupabaseError(error: unknown): void {
  if (!error) return;
  throw normalizeSupabaseError(error);
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
