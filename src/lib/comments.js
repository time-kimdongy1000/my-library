import { getVisitorId } from './analytics'
import { getSupabase } from './supabase'

async function invoke(functionName, body) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('SUPABASE_UNAVAILABLE')

  const { data, error } = await supabase.rpc(functionName, body)
  if (error) throw new Error(error.message)
  return data
}

export async function getComments(bookId) {
  const data = await invoke('get_comments', { p_book_id: bookId })
  return Array.isArray(data) ? data : []
}

export async function createComment({ bookId, nickname, body, password, language }) {
  const visitorId = getVisitorId()
  if (!visitorId) throw new Error('VISITOR_ID_UNAVAILABLE')

  const data = await invoke('create_comment', {
    p_book_id: bookId,
    p_visitor_id: visitorId,
    p_nickname: nickname,
    p_body: body,
    p_password: password,
    p_language: language,
  })

  return Array.isArray(data) ? data[0] : null
}

export async function deleteComment(commentId, password) {
  const visitorId = getVisitorId()
  if (!visitorId) throw new Error('VISITOR_ID_UNAVAILABLE')

  return Boolean(await invoke('delete_comment', {
    p_comment_id: commentId,
    p_password: password,
    p_visitor_id: visitorId,
  }))
}
