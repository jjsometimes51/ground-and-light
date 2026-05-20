import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { PortableText } from 'next-sanity'
import type { Metadata } from 'next'
import { sanityFetch, withTimeout } from '../../lib/sanity'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Ground & Light.',
  alternates: { canonical: '/about' }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AboutBlock = {
  _type: 'block'
  _key?: string
  style?: string
  markDefs?: any[]
  children?: Array<{ text?: string }>
}

type AboutSettings = {
  _id?: string
  about?: AboutBlock[]
}

function aboutText(blocks?: AboutBlock[]) {
  return (blocks || [])
    .map(block => (block.children || []).map(child => child.text || '').join(''))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

function isOldDefaultAbout(blocks?: AboutBlock[]) {
  const text = aboutText(blocks)
    .toLowerCase()
    .replace(/\s+/g, ' ')

  const oldDefault = [
    'builder. observer.',
    'interested in technology, people, and the structures that shape our lives.',
    'this page can be edited from /admin in site settings.'
  ].join(' ').toLowerCase()

  return text === oldDefault
}

function pickAbout(settings: AboutSettings[] | null) {
  const candidates = settings || []
  const preferred = candidates.find(item => item._id === 'siteSettings' && aboutText(item.about) && !isOldDefaultAbout(item.about))
    || candidates.find(item => aboutText(item.about) && !isOldDefaultAbout(item.about))

  return preferred?.about || []
}

export default async function AboutPage() {
  const settings = await withTimeout(
    sanityFetch<AboutSettings[]>(`*[_type == "siteSettings"] | order(_updatedAt desc){
      _id,
      about[_type == "block"]{
        _type,
        _key,
        style,
        markDefs,
        children[]{
          _type,
          _key,
          text,
          marks
        }
      }
    }`).catch(() => null),
    null,
    3000
  )
  const about = pickAbout(settings)

  return (
    <>
      <Header />
      <main className="container article">
        <article className="article-inner about-content">
          {about?.length ? <PortableText value={about} /> : null}
        </article>
      </main>
      <Footer />
    </>
  )
}
