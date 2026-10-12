import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'
import { books } from './data/book'
import { getSiteVisitorCount, recordSiteVisit } from './lib/analytics'

const pageLabels = {
  ko: { library: '나의 서가', review: '나의 독서 기록', missing: '책을 찾을 수 없습니다' },
  ja: { library: '私の本棚', review: '私の読書記録', missing: '本が見つかりません' },
  en: { library: 'My Library', review: 'My Reading Notes', missing: 'Book not found' },
}

const supportedLanguages = ['ko', 'ja', 'en']

function PageMetadata({ language }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const copy = pageLabels[language] ?? pageLabels.ko
    const bookId = pathname.match(/^\/(?:ko|ja|en)\/book\/([^/]+)$/)?.[1]
    const book = books.find((item) => item.id === bookId)
    const localizedBook = book?.translations?.[language] ?? book

    document.documentElement.lang = language
    document.title = bookId
      ? (localizedBook ? `${localizedBook.title} — ${copy.review} | My Library` : `${copy.missing} | My Library`)
      : `${copy.library} | My Library`
  }, [language, pathname])

  return null
}

function LegacyBookRedirect() {
  const { id } = useParams()
  return <Navigate to={`/ko/book/${id}`} replace />
}

function MissingPage({ language }) {
  const copy = pageLabels[language] ?? pageLabels.ko
  return <h1 lang={language}>{copy.missing}</h1>
}

function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const language = pathname.match(/^\/(ko|ja|en)(?:\/|$)/)?.[1] ?? 'ko'
  const [visitorCount, setVisitorCount] = useState(null)

  const changeLanguage = (nextLanguage) => {
    if (!supportedLanguages.includes(nextLanguage) || nextLanguage === language) return

    const localizedPath = pathname.match(/^\/(?:ko|ja|en)(\/.*)?$/)
    const legacyBookPath = pathname.match(/^\/book\/(.+)$/)
    const suffix = localizedPath?.[1] ?? (legacyBookPath ? `/book/${legacyBookPath[1]}` : '')
    navigate(`/${nextLanguage}${suffix}`)
  }

  useEffect(() => {
    let isCurrent = true

    const trackVisitor = async () => {
      await recordSiteVisit()
      const count = await getSiteVisitorCount()
      if (isCurrent && typeof count === 'number') setVisitorCount(count)
    }

    trackVisitor()

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <>
      <PageMetadata language={language} />
      <Routes>
        <Route path="/" element={<Navigate to="/ko" replace />} />
        <Route path="/book/:id" element={<LegacyBookRedirect />} />
        {supportedLanguages.map((routeLanguage) => (
          <Route
            key={routeLanguage}
            path={`/${routeLanguage}`}
            element={<Library language={routeLanguage} onLanguageChange={changeLanguage} visitorCount={visitorCount} />}
          />
        ))}
        {supportedLanguages.map((routeLanguage) => (
          <Route
            key={`${routeLanguage}-book`}
            path={`/${routeLanguage}/book/:id`}
            element={<BookDetail language={routeLanguage} onLanguageChange={changeLanguage} />}
          />
        ))}
        <Route path="*" element={<MissingPage language={language} />} />
      </Routes>
    </>
  )
}

export default App
