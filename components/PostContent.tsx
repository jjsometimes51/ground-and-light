import { PortableText } from 'next-sanity'
import { urlFor } from '../lib/sanity'
import ApprovedComments from './ApprovedComments'
import CommentForm from './CommentForm'

type MediaFile = {
  asset?: {
    url?: string
    mimeType?: string
    originalFilename?: string
  }
}

type Post = {
  _id?: string
  title: string
  category: string
  publishedAt?: string
  excerpt?: string
  coverImage?: any
  body?: any[]
  audio?: MediaFile
  video?: MediaFile
}

function key(prefix: string, index: number) {
  return `${prefix}${index.toString(36)}`
}

function isAudio(file?: MediaFile) {
  return file?.asset?.mimeType?.startsWith('audio/') || file?.asset?.url?.match(/\.(mp3|m4a|wav|ogg)$/i)
}

function isVideo(file?: MediaFile) {
  return file?.asset?.mimeType?.startsWith('video/') || file?.asset?.url?.match(/\.(mp4|mov|webm)$/i)
}

function fileUrlFromRef(ref: string) {
  const match = ref.match(/^file-([a-f0-9]+)-([a-z0-9]+)$/i)
  if (!match) return undefined

  return `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me'}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/${match[1]}.${match[2]}`
}

function textBlock(text: string, index: number) {
  return {
    _type: 'block',
    _key: key('b', index),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: key('s', index),
        text,
        marks: []
      }
    ]
  }
}

function mediaBlockFromMarkdown(text: string, index: number) {
  const imageMatch = text.match(/^!\[([^\]]*)\]\(sanity:(image-[^)]+)\)$/)
  if (imageMatch) {
    return {
      _type: 'image',
      _key: key('i', index),
      asset: {
        _type: 'reference',
        _ref: imageMatch[2]
      }
    }
  }

  const fileMatch = text.match(/^\[([^\]]+)\]\(sanity:(file-[^)]+)\)$/)
  if (fileMatch) {
    const url = fileUrlFromRef(fileMatch[2])

    return {
      _type: 'file',
      _key: key('f', index),
      asset: {
        _type: 'reference',
        _ref: fileMatch[2],
        ...(url ? { url } : {})
      }
    }
  }

  return null
}

function normalizeBody(body?: any[]) {
  if (!body) return []

  return body.flatMap((block, blockIndex) => {
    if (block?._type !== 'block') return [block]

    const text = block.children?.map((child: any) => child?.text || '').join('') || ''
    if (!text.includes('sanity:')) return [block]

    return text
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((part: string, partIndex: number) => {
        const trimmed = part.trim()
        return mediaBlockFromMarkdown(trimmed, blockIndex * 100 + partIndex) || textBlock(trimmed, blockIndex * 100 + partIndex)
      })
      .filter((part: any) => {
        if (part?._type !== 'block') return true
        return Boolean(part.children?.some((child: any) => child?.text))
      })
  })
}

const portableComponents = {
  types: {
    image: ({ value }: { value: any }) => {
      if (!value?.asset) return null

      return (
        <figure className="article-figure">
          <img src={urlFor(value).width(1400).url()} alt="" />
        </figure>
      )
    },
    file: ({ value }: { value: MediaFile }) => {
      if (!value?.asset?.url) return null

      if (isAudio(value)) {
        return (
          <div className="article-media">
            <audio className="audio" controls src={value.asset.url} />
          </div>
        )
      }

      if (isVideo(value)) {
        return (
          <figure className="article-figure">
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

function formatDate(value?: string) {
  if (!value) return ''

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

const categoryLabels: Record<string, string> = {
  Travel: '旅行笔记',
  Notes: '文章',
  Work: '工作记录',
  Musings: '随笔'
}

export default function PostContent({ post }: { post: Post }) {
  const dateLabel = formatDate(post.publishedAt)
  const categoryHref = `/${post.category.toLowerCase()}`
  const categoryLabel = categoryLabels[post.category] || post.category
  const body = normalizeBody(post.body)

  return (
    <article className="article-inner">
      <a className="article-back" href={categoryHref}>← Back</a>
      <div className="article-meta">
        <span>{post.category} · {categoryLabel}</span>
        {dateLabel && <time dateTime={post.publishedAt}>{dateLabel}</time>}
      </div>
      <h1>{post.title}</h1>
      {post.excerpt && <p className="article-excerpt">{post.excerpt}</p>}
      {post.coverImage && (
        <figure className="article-figure article-cover">
          <img src={urlFor(post.coverImage).width(1600).url()} alt="" />
        </figure>
      )}
      {post.audio?.asset?.url && (
        <div className="article-media">
          <audio className="audio" controls src={post.audio.asset.url} />
        </div>
      )}
      {post.video?.asset?.url && (
        <figure className="article-figure">
          <video controls src={post.video.asset.url} />
        </figure>
      )}
      {body.length > 0 && <PortableText value={body} components={portableComponents} />}
      <ApprovedComments postId={post._id} />
      <CommentForm postId={post._id} />
    </article>
  )
}
