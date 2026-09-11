import { useEffect, useMemo, useState } from 'react'
import { createComment, deleteComment, getComments } from '../lib/comments'

const commentCopy = {
  ko: {
    title: '댓글', intro: '이 글을 읽고 떠오른 생각을 남겨주세요.',
    passwordInfo: '삭제 비밀번호는 댓글을 지울 때만 사용되며 화면에 표시되지 않습니다.',
    nickname: '닉네임', nicknamePlaceholder: '2~20자', password: '삭제 비밀번호', passwordPlaceholder: '4자 이상',
    body: '댓글 내용', bodyPlaceholder: '서로를 존중하는 이야기를 남겨주세요.',
    submit: '댓글 남기기', submitting: '등록 중…', loading: '댓글을 불러오는 중입니다.',
    empty: '아직 댓글이 없습니다. 첫 생각을 남겨보세요.', delete: '삭제', cancel: '취소',
    confirmDelete: '삭제하기', deleting: '삭제 중…', deletePassword: '작성 비밀번호 또는 관리자 비밀번호',
    invalid: '닉네임 2자 이상, 비밀번호 4자 이상, 댓글 2자 이상을 입력해주세요.',
    loadFailed: '댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    submitFailed: '댓글을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.',
    deleteFailed: '댓글을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
    wrongPassword: '비밀번호가 맞지 않습니다.', rateLimit: '댓글은 30초에 한 번 작성할 수 있습니다.',
    deleteConfirm: '정말 이 댓글을 삭제하시겠습니까?',
    dailyLimit: '한 기기에서는 하루에 댓글을 10개까지 작성할 수 있습니다.',
    globalLimit: '댓글 요청이 많아 잠시 작성할 수 없습니다. 나중에 다시 시도해주세요.',
    duplicate: '같은 내용의 댓글이 최근에 등록되었습니다.',
    deleteRateLimit: '삭제 시도가 너무 많습니다. 10분 뒤 다시 시도해주세요.',
  },
  ja: {
    title: 'コメント', intro: 'この文章を読んで浮かんだことを残してください。',
    passwordInfo: '削除用パスワードはコメントを削除するときだけ使用され、画面には表示されません。',
    nickname: 'ニックネーム', nicknamePlaceholder: '2〜20文字', password: '削除用パスワード', passwordPlaceholder: '4文字以上',
    body: 'コメント', bodyPlaceholder: 'お互いを尊重する言葉でお書きください。',
    submit: 'コメントを投稿', submitting: '投稿中…', loading: 'コメントを読み込んでいます。',
    empty: 'まだコメントはありません。最初の感想を残してみませんか。', delete: '削除', cancel: 'キャンセル',
    confirmDelete: '削除する', deleting: '削除中…', deletePassword: '投稿時のパスワードまたは管理者パスワード',
    invalid: 'ニックネーム2文字以上、パスワード4文字以上、コメント2文字以上で入力してください。',
    loadFailed: 'コメントを読み込めませんでした。しばらくしてからもう一度お試しください。',
    submitFailed: 'コメントを投稿できませんでした。しばらくしてからもう一度お試しください。',
    deleteFailed: 'コメントを削除できませんでした。しばらくしてからもう一度お試しください。',
    wrongPassword: 'パスワードが一致しません。', rateLimit: 'コメントは30秒に一度投稿できます。',
    deleteConfirm: 'このコメントを本当に削除しますか？',
    dailyLimit: '1台の端末から投稿できるコメントは1日10件までです。',
    globalLimit: 'コメントのリクエストが集中しています。しばらくしてからもう一度お試しください。',
    duplicate: '同じ内容のコメントが最近投稿されています。',
    deleteRateLimit: '削除の試行回数が多すぎます。10分後にもう一度お試しください。',
  },
  en: {
    title: 'Comments', intro: 'Leave a thought that stayed with you after reading.',
    passwordInfo: 'Your delete password is used only to remove your comment and is never displayed.',
    nickname: 'Name', nicknamePlaceholder: '2–20 characters', password: 'Delete password', passwordPlaceholder: 'At least 4 characters',
    body: 'Comment', bodyPlaceholder: 'Share your thoughts with care for other readers.',
    submit: 'Post comment', submitting: 'Posting…', loading: 'Loading comments.',
    empty: 'No comments yet. Be the first to leave a thought.', delete: 'Delete', cancel: 'Cancel',
    confirmDelete: 'Delete comment', deleting: 'Deleting…', deletePassword: 'Author password or administrator password',
    invalid: 'Use at least 2 characters for your name and comment, and 4 for your password.',
    loadFailed: 'Comments could not be loaded. Please try again in a moment.',
    submitFailed: 'Your comment could not be posted. Please try again in a moment.',
    deleteFailed: 'The comment could not be deleted. Please try again in a moment.',
    wrongPassword: 'That password does not match.', rateLimit: 'You can post one comment every 30 seconds.',
    deleteConfirm: 'Are you sure you want to delete this comment?',
    dailyLimit: 'You can post up to 10 comments per device each day.',
    globalLimit: 'Comments are receiving heavy traffic. Please try again later.',
    duplicate: 'The same comment was posted recently.',
    deleteRateLimit: 'Too many delete attempts. Please try again in 10 minutes.',
  },
}

const localeByLanguage = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' }

function CommentSection({ bookId, language }) {
  const copy = commentCopy[language] ?? commentCopy.ko
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ nickname: '', password: '', body: '' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(localeByLanguage[language], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }), [language])

  useEffect(() => {
    let isCurrent = true
    const loadComments = async () => {
      setIsLoading(true)
      setMessage('')
      try {
        const loadedComments = await getComments(bookId)
        if (isCurrent) setComments(loadedComments)
      } catch {
        if (isCurrent) setMessage(copy.loadFailed)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    loadComments()
    return () => { isCurrent = false }
  }, [bookId, copy.loadFailed])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (message) setMessage('')
  }

  const submitComment = async (event) => {
    event.preventDefault()
    const nickname = form.nickname.trim()
    const body = form.body.trim()
    const passwordBytes = new TextEncoder().encode(form.password).length

    if (nickname.length < 2 || nickname.length > 20 || passwordBytes < 4 || passwordBytes > 72 || body.length < 2 || body.length > 500) {
      setMessage(copy.invalid)
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      const comment = await createComment({ bookId, nickname, body, password: form.password, language })
      if (!comment) throw new Error('EMPTY_COMMENT_RESPONSE')
      setComments((current) => [...current, comment])
      setForm({ nickname: '', password: '', body: '' })
    } catch (error) {
      if (error.message.includes('COMMENT_RATE_LIMIT')) setMessage(copy.rateLimit)
      else if (error.message.includes('COMMENT_DAILY_LIMIT')) setMessage(copy.dailyLimit)
      else if (error.message.includes('COMMENT_GLOBAL_LIMIT')) setMessage(copy.globalLimit)
      else if (error.message.includes('COMMENT_DUPLICATE')) setMessage(copy.duplicate)
      else setMessage(copy.submitFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestDelete = (commentId) => {
    setDeleteTarget(commentId)
    setDeletePassword('')
    setMessage('')
  }

  const cancelDelete = () => {
    setDeleteTarget(null)
    setDeletePassword('')
    setMessage('')
  }

  const confirmDelete = async (commentId) => {
    if (!deletePassword) {
      setMessage(copy.wrongPassword)
      return
    }

    if (!window.confirm(copy.deleteConfirm)) return

    setDeletingId(commentId)
    setMessage('')
    try {
      const deleted = await deleteComment(commentId, deletePassword)
      if (!deleted) {
        setMessage(copy.wrongPassword)
        return
      }
      setComments((current) => current.filter(({ id }) => id !== commentId))
      cancelDelete()
    } catch (error) {
      setMessage(error.message.includes('DELETE_RATE_LIMIT') ? copy.deleteRateLimit : copy.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="comments" lang={language} aria-labelledby="comments-title">
      <header className="comments-header">
        <div>
          <h2 id="comments-title">{copy.title} <span>{comments.length}</span></h2>
          <p>{copy.intro}</p>
        </div>
      </header>

      <p className="comments-preview-note">{copy.passwordInfo}</p>

      <form className="comment-form" onSubmit={submitComment}>
        <div className="comment-identity-fields">
          <label>
            <span>{copy.nickname}</span>
            <input type="text" value={form.nickname} maxLength="20" autoComplete="nickname"
              placeholder={copy.nicknamePlaceholder} disabled={isSubmitting}
              onChange={(event) => updateField('nickname', event.target.value)} />
          </label>
          <label>
            <span>{copy.password}</span>
            <input type="password" value={form.password} maxLength="40" autoComplete="new-password"
              placeholder={copy.passwordPlaceholder} disabled={isSubmitting}
              onChange={(event) => updateField('password', event.target.value)} />
          </label>
        </div>
        <label className="comment-body-field">
          <span>{copy.body}</span>
          <textarea value={form.body} maxLength="500" rows="5" placeholder={copy.bodyPlaceholder}
            disabled={isSubmitting} onChange={(event) => updateField('body', event.target.value)} />
        </label>
        <div className="comment-form-footer">
          <span className="comment-character-count">{form.body.length} / 500</span>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? copy.submitting : copy.submit}</button>
        </div>
      </form>

      <p className="comment-message" role="status" aria-live="polite">{message}</p>

      <div className="comment-list" aria-busy={isLoading}>
        {isLoading && <p className="comments-empty">{copy.loading}</p>}
        {!isLoading && comments.length === 0 && <p className="comments-empty">{copy.empty}</p>}
        {!isLoading && comments.map((comment) => {
          const createdAt = new Date(comment.created_at)
          return (
            <article className="comment-item" key={comment.id}>
              <header>
                <strong>{comment.nickname}</strong>
                <time dateTime={createdAt.toISOString()}>{dateFormatter.format(createdAt)}</time>
              </header>
              <p>{comment.body}</p>
              {deleteTarget === comment.id ? (
                <div className="comment-delete-form">
                  <label>
                    <span>{copy.deletePassword}</span>
                    <input type="password" value={deletePassword} maxLength="72" autoFocus
                      disabled={deletingId === comment.id}
                      onChange={(event) => {
                        setDeletePassword(event.target.value)
                        if (message) setMessage('')
                      }} />
                  </label>
                  <div>
                    <button type="button" className="comment-text-button" disabled={deletingId === comment.id}
                      onClick={cancelDelete}>{copy.cancel}</button>
                    <button type="button" className="comment-delete-confirm" disabled={deletingId === comment.id}
                      onClick={() => confirmDelete(comment.id)}>
                      {deletingId === comment.id ? copy.deleting : copy.confirmDelete}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="comment-text-button comment-delete-open"
                  onClick={() => requestDelete(comment.id)}>{copy.delete}</button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CommentSection
