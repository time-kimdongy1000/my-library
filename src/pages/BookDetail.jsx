import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { books } from '../data/book'
import ReactMarkdown from 'react-markdown'
import LanguageSelector from '../LanguageSelector'

import '../BookDetail.css'




const reviews = import.meta.glob(
  '../data/reviews/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
)

function createHeadingId(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
}

function BookDetail({ language, onLanguageChange }) {
    const [shareStatus, setShareStatus] = useState('')
    const backToLibraryLabel = {
        ko: '서가로',
        ja: '本棚へ',
        en: 'Back to library',
    }[language] ?? '서가로'
    const shareLabels = {
        ko: { title: '공유하기', native: '공유', copy: '링크 복사', copied: '링크를 복사했어요.', failed: '링크를 복사하지 못했어요.', x: 'X에 공유' },
        ja: { title: 'シェア', native: '共有', copy: 'リンクをコピー', copied: 'リンクをコピーしました。', failed: 'リンクをコピーできませんでした。', x: 'Xでシェア' },
        en: { title: 'Share', native: 'Share', copy: 'Copy link', copied: 'Link copied.', failed: 'Could not copy the link.', x: 'Share on X' },
    }[language]
  
    const { id } = useParams()
    const book = books.find((book) => book.id === id)
    

    if(!book){
        return <h1>책을 찾을 수 없습니다.</h1>
    }

      const localizedBook = book.translations?.[language] ?? book
      const originalReview = reviews[`../data/reviews/${id}.md`] ?? ''
      const translatedReview = reviews[`../data/reviews/${id}.${language}.md`]
      const review = translatedReview ?? originalReview
      const reviewLanguage = translatedReview ? language : 'ko'
      const contentsLabel = { ko: '목차', ja: '目次', en: 'Contents' }[language] ?? '목차'
      const shareTitle = {
          ko: `${localizedBook.title} — 나의 독서 기록`,
          ja: `${localizedBook.title} — 私の読書記録`,
          en: `${localizedBook.title} — My Reading Notes`,
      }[language]

      const getShareUrl = () => `${window.location.origin}${window.location.pathname}`

      const copyLink = async () => {
          try {
              await navigator.clipboard.writeText(getShareUrl())
              setShareStatus(shareLabels.copied)
          } catch {
              setShareStatus(shareLabels.failed)
          }
      }

      const sharePage = async () => {
          if (!navigator.share) {
              await copyLink()
              return
          }

          try {
              await navigator.share({ title: shareTitle, text: shareTitle, url: getShareUrl() })
          } catch (error) {
              if (error.name !== 'AbortError') setShareStatus(shareLabels.failed)
          }
      }

      const shareOnX = () => {
          const params = new URLSearchParams({ text: shareTitle, url: getShareUrl() })
          window.open(`https://x.com/intent/post?${params}`, '_blank', 'noopener,noreferrer')
      }

      const headings = review.split('\n')
                             .filter((line) => line.startsWith('## ') || line.startsWith('### '))
                             .map((line) => {
                                    const level = line.startsWith('### ') ? 3 : 2
                                    const text = line.replace(/^#{2,3}\s/, '')
                                    const headingId = createHeadingId(text)

                                 return {
                                    text,
                                    level,
                                    id: headingId,
                                }
                                    
                             })




    return (

        <div className='book-detail'>
            <LanguageSelector language={language} onLanguageChange={onLanguageChange} />
            <h1 lang={language}>{localizedBook.title}</h1>
            <p lang={language}>{localizedBook.author}</p>
            <img src={book.cover} alt={localizedBook.title} className='detail-cover'/>

           

        <div className='book-content'>

            <article lang={reviewLanguage}>
                <ReactMarkdown
                    components={{
                        h2: ({ children }) => {
                        const text = String(children)
                        const id = createHeadingId(text)

                        return (
                            <h2 id={id}>
                                {children}
                            </h2>
                        )
                    },

                    h3: ({ children }) => {
                        const text = String(children)
                        const id = createHeadingId(text)

                        return (
                            <h3 id={id}>
                                {children}
                            </h3>
                        )},
                    }}
                >
                {review}
                </ReactMarkdown>
            </article>


    <aside className='book-sidebar'>
    <nav className='table-of-contents' lang={reviewLanguage}>
        <h2 lang={language}>{contentsLabel}</h2>

        <ul>
            {headings.map((heading) => (
                <li
                    key={heading.id}
                    className={`toc-level-${heading.level}`}
                >
                    <a
                        href={`#${heading.id}`}
                        onClick={(e) => {
                            e.preventDefault()
                            const target = document.getElementById(heading.id)
                            console.log('목차 클릭:', heading.id, target)

                            if (target) {

                                const y = target.getBoundingClientRect().top + window.scrollY - 30

                                console.log('스크롤 위치:', y)


                                window.scrollTo({
                                    top: y,
                                    behavior: 'smooth',
                                })
                            }
                        }}
                    >
                    {heading.text}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
        <Link
            to="/"
            className="back-to-library"
            lang={language}
            onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
            <span aria-hidden="true">←</span> {backToLibraryLabel}
        </Link>
        <section className="share-card" lang={language} aria-labelledby="share-title">
            <h2 id="share-title">{shareLabels.title}</h2>
            <div className="share-actions">
                <button type="button" onClick={sharePage} aria-label={shareLabels.native} title={shareLabels.native}>
                    <span className="share-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M14 5l6 5-6 5v-3.2c-4.8 0-8.1 1.5-10 4.7.7-5.2 3.8-8 10-8.5V5z" />
                        </svg>
                    </span>
                    <span>{shareLabels.native}</span>
                </button>
                <button type="button" onClick={copyLink} aria-label={shareLabels.copy} title={shareLabels.copy}>
                    <span className="share-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M9.5 7.5l1.4-1.4a4 4 0 015.7 5.7l-2.1 2.1a4 4 0 01-5.7 0" />
                            <path d="M14.5 16.5l-1.4 1.4a4 4 0 01-5.7-5.7l2.1-2.1a4 4 0 015.7 0" />
                        </svg>
                    </span>
                    <span>{shareLabels.copy}</span>
                </button>
                <button type="button" onClick={shareOnX} aria-label={shareLabels.x} title={shareLabels.x}>
                    <span className="share-icon share-x" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </span>
                    <span>X</span>
                </button>
            </div>
            <p className="share-status" role="status" aria-live="polite">{shareStatus}</p>
        </section>
    </aside>

</div>

        </div>
    )
}

export default BookDetail
