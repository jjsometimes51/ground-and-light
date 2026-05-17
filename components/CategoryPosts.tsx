'use client'

import { useEffect, useState } from 'react'
import PostCard from './PostCard'

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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-05-12'

export default function CategoryPosts({ category, initialPosts }: { category: string; initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)

  useEffect(() => {
    const query = `*[
      _type == "post" &&
      category == ${JSON.stringify(category)} &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") == "public"
    ] | order(coalesce(publishedAt, _createdAt) desc){
      title,
      slug,
      category,
      excerpt,
      coverImage,
      audio{asset->{url, mimeType, originalFilename}},
      video{asset->{url, mimeType, originalFilename}}
    }`
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`

    fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(payload => setPosts(payload.result || []))
      .catch(() => {
        setPosts(initialPosts)
      })
  }, [category, initialPosts])

  return (
    <section className="grid">
      {posts.map(post => <PostCard key={post.slug.current} post={post} />)}
    </section>
  )
}
