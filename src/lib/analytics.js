import { getSupabase } from './supabase'

const visitorStorageKey = 'pages-remain-visitor-id'

function getVisitorId() {
  try {
    const savedId = window.localStorage.getItem(visitorStorageKey)
    if (savedId) return savedId

    const visitorId = crypto.randomUUID()
    window.localStorage.setItem(visitorStorageKey, visitorId)
    return visitorId
  } catch {
    return null
  }
}

async function invoke(functionName, body) {
  const supabase = await getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.rpc(functionName, body)
  if (error) {
    console.warn(`Supabase ${functionName} failed`, error.message)
    return null
  }

  return data
}

export function recordSiteVisit() {
  const visitorId = getVisitorId()
  if (!visitorId) return Promise.resolve()
  return invoke('record_site_visit', { p_visitor_id: visitorId })
}

export function recordBookView(bookId) {
  const visitorId = getVisitorId()
  if (!visitorId) return Promise.resolve()

  return invoke('record_book_view', {
    p_book_id: bookId,
    p_visitor_id: visitorId,
  })
}

export function getBookViewCount(bookId) {
  return invoke('get_book_view_count', { p_book_id: bookId })
}

export function getSiteVisitorCount() {
  return invoke('get_site_visitor_count', {})
}
