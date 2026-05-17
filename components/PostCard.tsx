import Link from 'next/link'
import { urlFor } from '../lib/sanity'

type Post = {
  title: string
  slug: { current: string }
  category: string
  excerpt?: string
  coverImage?: any
  audio?: {
    asset?: {
      url?: string
      mimeType?: string
      originalFilename?: string
    }
  }
  video?: {
    asset?: {
      url?: string
      mimeType?: string
      originalFilename?: string
    }
  }
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="card">
      {post.coverImage && (
        <Link href={`/post/${post.slug.current}`}>
          <img className="card-media" src={urlFor(post.coverImage).width(900).height(650).url()} alt="" />
        </Link>
      )}
      {!post.coverImage && post.video?.asset?.url && (
        <video className="card-media" controls muted preload="metadata" src={post.video.asset.url} />
      )}
      {!post.coverImage && !post.video?.asset?.url && post.audio?.asset?.url && (
        <div className="card-audio">
          <audio controls preload="metadata" src={post.audio.asset.url} />
        </div>
      )}
      <Link href={`/post/${post.slug.current}`}>
        <div className="card-meta">{post.category}</div>
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
      </Link>
    </article>
  )
}
