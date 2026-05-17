import { PortableText } from 'next-sanity'
import { urlFor } from '../lib/sanity'

type MediaFile = {
  asset?: {
    url?: string
    mimeType?: string
    originalFilename?: string
  }
}

type Post = {
  title: string
  category: string
  excerpt?: string
  coverImage?: any
  body?: any[]
  audio?: MediaFile
  video?: MediaFile
}

function isAudio(file?: MediaFile) {
  return file?.asset?.mimeType?.startsWith('audio/') || file?.asset?.url?.match(/\.(mp3|m4a|wav|ogg)$/i)
}

function isVideo(file?: MediaFile) {
  return file?.asset?.mimeType?.startsWith('video/') || file?.asset?.url?.match(/\.(mp4|mov|webm)$/i)
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

export default function PostContent({ post }: { post: Post }) {
  return (
    <article className="article-inner">
      <div className="card-meta">{post.category}</div>
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
      {post.body && <PortableText value={post.body} components={portableComponents} />}
    </article>
  )
}
