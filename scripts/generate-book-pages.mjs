import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = 'https://pagesremain.com'
const languages = ['ko', 'ja', 'en']
const localeByLanguage = { ko: 'ko_KR', ja: 'ja_JP', en: 'en_US' }
const pageCopy = {
  ko: { libraryTitle: '나의 서가 — 독후감 모음', libraryDescription: '읽은 책을 한국어, 일본어, 영어로 기록하는 개인 서가입니다.', review: '나의 독서 기록', imageAlt: (title) => `${title} 책 표지와 독서 기록 공유 카드` },
  ja: { libraryTitle: '私の本棚 — 読書感想', libraryDescription: '読んだ本について、韓国語・日本語・英語で綴る個人の本棚です。', review: '私の読書記録', imageAlt: (title) => `${title}の表紙と読書記録のシェアカード` },
  en: { libraryTitle: 'My Library — Reading Notes', libraryDescription: 'A personal library of reading notes in Korean, Japanese, and English.', review: 'My Reading Notes', imageAlt: (title) => `${title} cover and reading-notes sharing card` },
}

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

const alternateLinks = (pathSuffix) => [
  ...languages.map((language) => `<link rel="alternate" hreflang="${language}" href="${siteUrl}/${language}${pathSuffix}" />`),
  `<link rel="alternate" hreflang="x-default" href="${siteUrl}/ko${pathSuffix}" />`,
].join('\n    ')

const setPageHead = ({ html, language, title, description, pageUrl, imageUrl, imageAlt, type, pathSuffix, schema }) => {
  const alternateLocales = languages
    .filter((item) => item !== language)
    .map((item) => `<meta property="og:locale:alternate" content="${localeByLanguage[item]}" />`)
    .join('\n    ')

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${language}">`)
  html = replaceMeta(html, 'name', 'description', description)
  html = replaceMeta(html, 'property', 'og:type', type)
  html = replaceMeta(html, 'property', 'og:site_name', 'Pages Remain')
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', description)
  html = replaceMeta(html, 'property', 'og:url', pageUrl)
  html = replaceMeta(html, 'property', 'og:locale', localeByLanguage[language])
  html = html.replace(/\s*<meta property="og:locale:alternate" content="[^"]*" \/>/g, '')
  html = html.replace(/(<meta property="og:locale" content="[^"]*" \/>)/, `$1\n    ${alternateLocales}`)
  html = replaceMeta(html, 'property', 'og:image', imageUrl)
  html = replaceMeta(html, 'property', 'og:image:secure_url', imageUrl)
  html = replaceMeta(html, 'property', 'og:image:alt', imageAlt)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', description)
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl)
  html = replaceMeta(html, 'name', 'twitter:image:alt', imageAlt)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${pageUrl}" />`)
  html = html.replace(/(<link rel="canonical" href="[^"]*" \/>)/, `$1\n    ${alternateLinks(pathSuffix)}`)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)} | Pages Remain</title>`)
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>\n  </head>`)
  return html
}

const writePage = async (segments, html) => {
  const outputDirectory = path.join(projectRoot, 'dist', ...segments)
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(path.join(outputDirectory, 'index.html'), html)
}

for (const language of languages) {
  const copy = pageCopy[language]
  const pageUrl = `${siteUrl}/${language}`
  const imageUrl = `${siteUrl}${books[0].social.image}`
  const libraryHtml = setPageHead({
    html: baseHtml,
    language,
    title: copy.libraryTitle,
    description: copy.libraryDescription,
    pageUrl,
    imageUrl,
    imageAlt: copy.imageAlt(books[0].translations[language].title),
    type: 'website',
    pathSuffix: '',
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: copy.libraryTitle, description: copy.libraryDescription, url: pageUrl, inLanguage: language, isPartOf: { '@type': 'WebSite', name: 'Pages Remain', url: siteUrl } },
  })

  await writePage([language], libraryHtml)
  if (language === 'ko') await writeFile(path.join(projectRoot, 'dist/index.html'), libraryHtml)

  for (const book of books) {
    const localizedBook = book.translations[language]
    const pathSuffix = `/book/${book.id}`
    const pageUrl = `${siteUrl}/${language}${pathSuffix}`
    const imageUrl = `${siteUrl}${book.social.image}`
    const title = `${localizedBook.title} — ${copy.review}`
    const description = localizedBook.synopsis
    const html = setPageHead({
      html: baseHtml,
      language,
      title,
      description,
      pageUrl,
      imageUrl,
      imageAlt: copy.imageAlt(localizedBook.title),
      type: 'article',
      pathSuffix,
      schema: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description, image: imageUrl, datePublished: book.reviewedAt, dateModified: book.reviewedAt, inLanguage: language, mainEntityOfPage: pageUrl, author: { '@type': 'Organization', name: 'Pages Remain', url: `${siteUrl}/${language}` }, about: { '@type': 'Book', name: localizedBook.title, author: { '@type': 'Person', name: localizedBook.author } } },
    })
    await writePage([language, 'book', book.id], html)
  }
}

const sitemapEntries = []
const addSitemapEntry = ({ url, pathSuffix, lastModified }) => {
  sitemapEntries.push(`  <url>\n    <loc>${url}</loc>\n${languages.map((language) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${siteUrl}/${language}${pathSuffix}" />`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/ko${pathSuffix}" />${lastModified ? `\n    <lastmod>${lastModified}</lastmod>` : ''}\n  </url>`)
}

for (const language of languages) {
  addSitemapEntry({ url: `${siteUrl}/${language}`, pathSuffix: '' })
  for (const book of books) {
    addSitemapEntry({ url: `${siteUrl}/${language}/book/${book.id}`, pathSuffix: `/book/${book.id}`, lastModified: book.reviewedAt })
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`
await writeFile(path.join(projectRoot, 'dist/sitemap.xml'), sitemap)

console.log(`Generated ${languages.length} library pages, ${books.length * languages.length} localized book pages, and sitemap.xml.`)
