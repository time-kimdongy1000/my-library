import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'
import { books } from './data/book'
import { getSiteVisitorCount, recordSiteVisit } from './lib/analytics'

const pageLabels = {
  ko: { library: '나의 서가', review: '나의 독서 기록', missing: '책을 찾을 수 없습니다' },
  ja: { library: '私の本棚', review: '私の読書記録', missing: '本が見つかりません' },
  en: { library: 'My Library', review: 'My Reading Notes', missing: 'Book not found' },
}

function PageMetadata({ language }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const copy = pageLabels[language] ?? pageLabels.ko
    const bookId = pathname.match(/^\/book\/([^/]+)$/)?.[1]
    const book = books.find((item) => item.id === bookId)
    const localizedBook = book?.translations?.[language] ?? book

    document.documentElement.lang = language
    document.title = bookId
      ? (localizedBook ? `${localizedBook.title} — ${copy.review} | My Library` : `${copy.missing} | My Library`)
      : `${copy.library} | My Library`
  }, [language, pathname])

  return null
}

function App() {
  const [language, setLanguage] = useState('ko')
  const [visitorCount, setVisitorCount] = useState(null)

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
        <Route path="/" element={<Library language={language} onLanguageChange={setLanguage} visitorCount={visitorCount} />} />
        <Route path="/book/:id" element={<BookDetail language={language} onLanguageChange={setLanguage} />} />
      </Routes>
    </>
  )
}

export default App
