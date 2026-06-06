import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fallbackSupabaseUrl = 'https://placeholder.supabase.co'
const fallbackAnonKey = 'placeholder-anon-key'
const fallbackServiceRoleKey = 'placeholder-service-role-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key are required. Some features may not work.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(fallbackSupabaseUrl, fallbackAnonKey)

export const supabaseAdmin = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : createClient(fallbackSupabaseUrl, fallbackServiceRoleKey)
