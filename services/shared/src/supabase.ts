import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  }

  return createClient(supabaseUrl, supabaseKey);
}