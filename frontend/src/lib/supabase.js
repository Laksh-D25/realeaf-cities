import { createClient } from '@supabase/supabase-js'

// Safe environment variable access
const getSupabaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    // Client-side: check both process.env and window
    return process.env.NEXT_PUBLIC_SUPABASE_URL || window.__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL
  }
}

const getSupabaseAnonKey = () => {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } else {
    // Client-side: check both process.env and window
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

// Get environment variables safely
const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Supabase Environment Debug:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl?.substring(0, 30) + '...',
    keyPreview: supabaseAnonKey?.substring(0, 20) + '...'
  })
}

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please check your .env.local file is in the project root and contains: '
  )
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please check your .env.local file contains your anon key.'
  )
}

// Create Supabase client with error handling
let supabase
let supabaseAdmin

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  //Admin client check
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  console.log('Supabase client initialized successfully')
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
  throw error
}

export { supabase, supabaseAdmin, supabaseUrl }
export default supabase