import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const books = JSON.parse(await readFile(path.join(projectRoot, 'src/data/books.json'), 'utf8'))
const requiredLanguages = ['ko', 'ja', 'en']
const seenIds = new Set()
const missing = []

const exists = async (filePath) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

for (const book of books) {
  if (!/^[a-z0-9_]+$/.test(book.id)) throw new Error(`Invalid book id: ${book.id}`)
  if (seenIds.has(book.id)) throw new Error(`Duplicate book id: ${book.id}`)
  seenIds.add(book.id)

  for (const field of ['title', 'author', 'cover', 'reviewedAt', 'spineColor']) {
    if (!book[field]) missing.push(`${book.id}: ${field}`)
  }

  for (const language of requiredLanguages) {
    for (const field of ['title', 'author', 'synopsis']) {
      if (!book.translations?.[language]?.[field]) missing.push(`${book.id}: translations.${language}.${field}`)
    }

    const suffix = language === 'ko' ? '' : `.${language}`
    const reviewPath = path.join(projectRoot, `src/data/reviews/${book.id}${suffix}.md`)
    if (!(await exists(reviewPath))) missing.push(path.relative(projectRoot, reviewPath))
  }

  for (const [label, publicPath] of [['cover', book.cover], ['social.image', book.social?.image]]) {
    if (!publicPath?.startsWith('/')) {
      missing.push(`${book.id}: ${label} must start with /`)
      continue
    }
    const assetPath = path.join(projectRoot, 'public', publicPath.slice(1))
    if (!(await exists(assetPath))) missing.push(path.relative(projectRoot, assetPath))
  }

  for (const field of ['label', 'description']) {
    if (!book.social?.[field]) missing.push(`${book.id}: social.${field}`)
  }
  if (!Array.isArray(book.social?.question) || book.social.question.length !== 2) {
    missing.push(`${book.id}: social.question must contain two lines`)
  }
}

if (missing.length) {
  throw new Error(`Book content is incomplete:\n- ${missing.join('\n- ')}`)
}

console.log(`Validated ${books.length} book${books.length === 1 ? '' : 's'}.`)
