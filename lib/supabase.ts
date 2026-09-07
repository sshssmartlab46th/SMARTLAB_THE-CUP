import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton instances to prevent connection leaks across warm serverless/edge invocations.
 */
let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminClientInstance: SupabaseClient | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Public Anonymous Supabase Client (Edge-safe, Singleton, Read-only path)
 * Configured without persistent sessions or auto-refresh to prevent memory overhead in Edge runtime.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-application-name': 'the-sangsan-broadcast-edge',
        },
      },
    });
  }

  return supabaseClientInstance;
}

/**
 * Privileged Service Role Supabase Client (Strictly for Serverless Admin Update API)
 * Bypasses RLS to execute transactional score and event updates.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const serviceKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !serviceKey) {
    return null;
  }

  if (!supabaseAdminClientInstance) {
    supabaseAdminClientInstance = createClient(SUPABASE_URL, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': 'the-sangsan-broadcast-admin',
        },
      },
    });
  }

  return supabaseAdminClientInstance;
}
