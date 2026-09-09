import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LanguageSelector from '../LanguageSelector'
import { books } from '../data/book'
import '../Library.css'

const labels = {
  ko: { title: '나의 서가', hint: '책등을 눌러 한 권을 꺼내 보세요.', close: '책 다시 꽂기', about: '이 책의 이야기', read: '독후감 읽기', again: '표지를 한 번 더 누르면 독후감으로 이어집니다.', pick: '책 꺼내기' },
  ja: { title: '私の本棚', hint: '背表紙を押して、一冊手に取ってみてください。', close: '本棚に戻す', about: 'この本のあらすじ', read: '感想を読む', again: '表紙をもう一度押すと、読書感想に進みます。', pick: '本を手に取る' },
  en: { title: 'My Library', hint: 'Choose a spine. Take a book off the shelf.', close: 'Put book back', about: 'About the story', read: 'Read my review', again: 'Select the cover once more to read my thoughts.', pick: 'Take off the shelf' },
}

const visitorMessages = {
  ko: (count) => `지금까지 ${count.toLocaleString('ko-KR')}명이 이 서가를 다녀갔습니다.`,
  ja: (count) => `これまでに${count.toLocaleString('ja-JP')}人がこの本棚を訪れました。`,
  en: (count) => `${count.toLocaleString('en-US')} readers have visited this library.`,
}

function BookPreview({ book, language, onLanguageChange, origin, onClose }) {
  const dialogRef = useRef(null)
  const coverRef = useRef(null)
  const [phase, setPhase] = useState('opening')
  const navigate = useNavigate()
  const copy = labels[language] ?? labels.ko
  const localized = book.translations?.[language] ?? book

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const rect = coverRef.current.getBoundingClientRect()
    dialog.style.setProperty('--origin-x', `${origin.x - (rect.left + rect.width / 2)}px`)
    dialog.style.setProperty('--origin-y', `${origin.y - (rect.top + rect.height / 2)}px`)
    return () => {
      document.body.style.overflow = previousOverflow
      dialog.close()
    }
  }, [origin])

  const close = () => { if (phase !== 'leaving') setPhase('closing') }

  return (
    <dialog ref={dialogRef} className={`book-preview ${phase}`} aria-labelledby="preview-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="preview-panel" lang={language}>
        <div className="preview-toolbar">
          <LanguageSelector language={language} onLanguageChange={onLanguageChange} />
          <button type="button" className="preview-close" onClick={close} aria-label={copy.close} autoFocus>×</button>
        </div>
        <div className="preview-layout">
          <div className="preview-book-space">
            <div ref={coverRef} className="preview-book-anchor">
              <Link to={`/book/${book.id}`} className="preview-cover" aria-label={`${localized.title} — ${copy.read}`}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
                  event.preventDefault()
                  if (phase !== 'closing') setPhase('leaving')
                }}
                onAnimationEnd={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.animationName === 'book-return') onClose()
                  if (event.animationName === 'book-enter') {
                    navigate(`/book/${book.id}`)
                    window.scrollTo({ top: 0, behavior: 'instant' })
                  }
                }}>
                <img src={book.cover} alt={localized.title} />
              </Link>
            </div>
            <p className="preview-instruction">{copy.again}</p>
          </div>
          <section className="preview-copy">
            <span className="preview-eyebrow">{copy.about}</span>
            <h2 id="preview-title">{localized.title}</h2>
            <p className="preview-author">{localized.author}</p>
            <p className="preview-synopsis">{localized.synopsis}</p>
            <p className="preview-read-label" aria-hidden="true">← {copy.read}</p>
          </section>
        </div>
      </div>
    </dialog>
  )
}

export default function Library({ language, onLanguageChange, visitorCount }) {
  const [selection, setSelection] = useState(null)
  const copy = labels[language] ?? labels.ko

  return (
    <div className="library">
      <LanguageSelector language={language} onLanguageChange={onLanguageChange} />
      <h1 className="library-title" lang={language}>{copy.title}</h1>
      <p className="shelf-instruction" lang={language}>{copy.hint}</p>
      {visitorCount !== null && (
        <p className="visitor-count" lang={language}>{visitorMessages[language](visitorCount)}</p>
      )}
      <div className="bookshelf">
        <div className="shelf spine-shelf">
          {books.map((book) => {
            const localized = book.translations?.[language] ?? book
            return (
              <button key={book.id} type="button"
                className={`book-spine${selection?.book.id === book.id ? ' is-selected' : ''}`}
                lang={language} style={{ '--spine-color': book.spineColor ?? '#24465a', '--spine-cover': `url("${book.cover}")` }}
                aria-label={`${localized.title} — ${localized.author} · ${copy.pick}`} aria-haspopup="dialog"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  setSelection({ book, origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } })
                }}>
                <span className="spine-paper">
                  <span className="spine-title">{localized.title}</span>
                  <span className="spine-author">{localized.author}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {selection && <BookPreview book={selection.book} origin={selection.origin} language={language}
        onLanguageChange={onLanguageChange} onClose={() => setSelection(null)} />}
    </div>
  )
}
