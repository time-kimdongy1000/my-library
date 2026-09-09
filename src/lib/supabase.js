const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
let supabasePromise

export function getSupabase() {
  if (!supabaseUrl || !supabasePublishableKey) return Promise.resolve(null)

  if (!supabasePromise) {
    supabasePromise = import('@supabase/supabase-js').then(({ createClient }) => (
      createClient(supabaseUrl, supabasePublishableKey)
    ))
  }

  return supabasePromise
}
