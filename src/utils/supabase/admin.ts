import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin client — uses the SERVICE_ROLE key.
 * ⚠️  NEVER import this file in any Client Component or expose it to the browser.
 * Server Actions / Route Handlers / Server Components only.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
