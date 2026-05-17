'use client'

import { useEffect, useState } from 'react'
import PostContent from './PostContent'

type Post = {
  title: string
  category: string
  excerpt?: string
  coverImage?: any
  body?: any[]
  audio?: { asset?: { url?: string; mimeType?: string; originalFilename?: string } }
  video?: { asset?: { url?: string; mimeType?: string; originalFilename?: string } }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-05-12'

const postProjection = `{
  title,
  category,
  excerpt,
  coverImage,
  body[]{
    ...,
    asset->{url, mimeType, originalFilename}
  },
  audio{asset->{url, mimeType, originalFilename}},
  video{asset->{url, mimeType, originalFilename}},
  publishedAt
}`

export default function PostReader({ slug, initialPost }: { slug: string; initialPost: Post | null }) {
  const [post, setPost] = useState(initialPost)

  useEffect(() => {
    if (initialPost) return

    const query = `*[
      _type == "post" &&
      slug.current == ${JSON.stringify(slug)} &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") in ["public", "unlisted"]
    ][0]${postProjection}`
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`

    fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(payload => setPost(payload.result || null))
      .catch(() => setPost(null))
  }, [initialPost, slug])

  if (!post) return null

  return <PostContent post={post} />
}
