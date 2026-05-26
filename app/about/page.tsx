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
  _type: 'block' | 'image' | 'file'
  _key?: string
  asset?: {
    url?: string
    mimeType?: string
    originalFilename?: string
  }
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

function isAudio(block?: AboutBlock) {
  return block?.asset?.mimeType?.startsWith('audio/') || block?.asset?.url?.match(/\.(mp3|m4a|wav|ogg)$/i)
}

function isVideo(block?: AboutBlock) {
  return block?.asset?.mimeType?.startsWith('video/') || block?.asset?.url?.match(/\.(mp4|mov|webm)$/i)
}

const aboutComponents = {
  types: {
    image: ({ value }: { value: AboutBlock }) => {
      if (!value?.asset?.url) return null

      return (
        <figure className="about-media">
          <img src={value.asset.url} alt="" />
        </figure>
      )
    },
    file: ({ value }: { value: AboutBlock }) => {
      if (!value?.asset?.url) return null

      if (isAudio(value)) {
        return (
          <div className="about-media">
            <audio controls src={value.asset.url} />
          </div>
        )
      }

      if (isVideo(value)) {
        return (
          <figure className="about-media">
            <video controls src={value.asset.url} />
          </figure>
        )
      }

      return (
        <a className="article-file" href={value.asset.url}>
          {value.asset.originalFilename || 'Download file'}
        </a>
      )
    }
  }
}

export default async function AboutPage() {
  const settings = await withTimeout(
    sanityFetch<AboutSettings[]>(`*[_type == "siteSettings"] | order(_updatedAt desc){
      _id,
      about[]{
        _type,
        _key,
        style,
        markDefs,
        asset->{
          url,
          mimeType,
          originalFilename
        },
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
      <Header active="About" />
      <main className="article about-page">
        <article className="article-inner about-content">
          {about?.length ? <PortableText value={about} components={aboutComponents} /> : null}
        </article>
      </main>
      <Footer />
    </>
  )
}
