import LanguageSelector from '../LanguageSelector'
import { Link } from 'react-router-dom'
import { books } from '../data/book'
import '../Library.css'

function Library({ language, onLanguageChange }) {
  return (
    <div className="library">
      <LanguageSelector language={language} onLanguageChange={onLanguageChange} />
      <h1 className="library-title">My Library</h1>

      <div className="bookshelf">
        <div className="shelf">
          {books.map((book) => {
            const localizedBook = book.translations?.[language] ?? book

            return (
            <Link
              to={`/book/${book.id}`}
              className="book"
              key={book.id}
              lang={language}
            >
              <img
                src={book.cover}
                alt={localizedBook.title}
                className="book-cover"
              />

              <h2>{localizedBook.title}</h2>
              <p>{localizedBook.author}</p>
            </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Library
