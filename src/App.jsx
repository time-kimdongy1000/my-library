import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'

function App() {
  const [language, setLanguage] = useState('ko')

  return (
    <Routes>
      <Route path="/" element={<Library language={language} onLanguageChange={setLanguage} />} />
      <Route path="/book/:id" element={<BookDetail language={language} onLanguageChange={setLanguage} />} />
    </Routes>
  )
}

export default App
