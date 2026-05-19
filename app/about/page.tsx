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
  children?: Array<{ text?: string }>
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

export default async function AboutPage() {
  const settings = await withTimeout(
    sanityFetch<{ about?: any[] }>(`*[_type == "siteSettings"][0]{about}`).catch(() => null),
    null,
    3000
  )
  const about = isOldDefaultAbout(settings?.about) ? [] : settings?.about

  return (
    <>
      <Header />
      <main className="container article">
        {about?.length ? <PortableText value={about} /> : null}
      </main>
      <Footer />
    </>
  )
}
