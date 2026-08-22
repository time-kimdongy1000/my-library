import { Link } from 'react-router-dom'
import { books } from '../data/book'
import '../Library.css'

function Library() {
  return (
    <div className="library">
      <h1 className="library-title">My Library</h1>

      <div className="bookshelf">
        <div className="shelf">
          {books.map((book) => (
            <Link
              to={`/book/${book.id}`}
              className="book"
              key={book.id}
            >
              <img
                src={book.cover}
                alt={book.title}
                className="book-cover"
              />

              <h2>{book.title}</h2>
              <p>{book.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Library