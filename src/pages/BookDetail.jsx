import { useParams } from 'react-router-dom'
import { books } from '../data/book'
import ReactMarkdown from 'react-markdown'

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

function BookDetail() {
  
    const { id } = useParams()
    const book = books.find((book) => book.id === id)
    

    if(!book){
        return <h1>책을 찾을 수 없습니다.</h1>
    }

      const review = reviews[`../data/reviews/${id}.md`]

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
            <h1>{book.title}</h1>
            <p>{book.author}</p>
            <img src={book.cover} alt={book.title} className='detail-cover'/>

           

        <div className='book-content'>

            <article>
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


    <nav className='table-of-contents'>
        <h2>목차</h2>

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

</div>

        </div>
    )
}

export default BookDetail