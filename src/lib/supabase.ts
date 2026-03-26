import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// Lazy singleton browser client — safe for SSR (only initializes in browser)
let _supabase: ReturnType<typeof createBrowserClient> | null = null

export const supabase = typeof window !== 'undefined'
  ? (_supabase ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY))
  : createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
