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
    const backToLibraryLabel = {
        ko: '서가로',
        ja: '本棚へ',
        en: 'Back to library',
    }[language] ?? '서가로'
  
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
    </aside>

</div>

        </div>
    )
}

export default BookDetail
