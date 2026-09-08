import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = 'https://pagesremain.com'
const books = JSON.parse(await readFile(path.join(projectRoot, 'src/data/books.json'), 'utf8'))
const baseHtml = await readFile(path.join(projectRoot, 'dist/index.html'), 'utf8')

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const replaceMeta = (html, attribute, name, value) => {
  const pattern = new RegExp(`<meta ${attribute}="${name}" content="[^"]*" \\/>`)
  if (!pattern.test(html)) throw new Error(`Missing ${attribute}="${name}" in index.html`)
  return html.replace(pattern, `<meta ${attribute}="${name}" content="${escapeHtml(value)}" />`)
}

for (const book of books) {
  const pageUrl = `${siteUrl}/book/${book.id}`
  const imageUrl = `${siteUrl}${book.social.image}`
  const title = `${book.translations.ko.title} — ${book.social.label}`
  const imageAlt = `${book.translations.ko.title} 책 표지와 ${book.social.label} 문구가 담긴 공유 카드`
  let html = baseHtml

  html = replaceMeta(html, 'name', 'description', book.social.description)
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', book.social.description)
  html = replaceMeta(html, 'property', 'og:url', pageUrl)
  html = replaceMeta(html, 'property', 'og:image', imageUrl)
  html = replaceMeta(html, 'property', 'og:image:secure_url', imageUrl)
  html = replaceMeta(html, 'property', 'og:image:alt', imageAlt)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', book.social.description)
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl)
  html = replaceMeta(html, 'name', 'twitter:image:alt', imageAlt)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${pageUrl}" />`)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)} | My Library</title>`)

  const outputDirectory = path.join(projectRoot, 'dist/book', book.id)
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(path.join(outputDirectory, 'index.html'), html)
}

console.log(`Generated ${books.length} book page${books.length === 1 ? '' : 's'}.`)
