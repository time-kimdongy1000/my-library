import { Routes, Route } from 'react-router-dom'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/book/:id" element={<BookDetail />} />
    </Routes>
  )
}

export default App