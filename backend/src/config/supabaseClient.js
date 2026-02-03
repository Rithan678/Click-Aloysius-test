import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are required');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}
