'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Post = {
  title: string
  slug: { current: string }
  category: string
  excerpt?: string
  publishedAt?: string
  _createdAt?: string
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-05-12'

const categoryMeta: Record<string, { title: string; subtitle: string }> = {
  Travel: { title: 'Travel', subtitle: '旅行笔记' },
  Notes: { title: 'Notes', subtitle: '文章' },
  Work: { title: 'Work', subtitle: '工作记录' },
  Musings: { title: 'Musings', subtitle: '随想' }
}

function formatIndex(index: number) {
  return String(index + 1).padStart(3, '0')
}

function formatDate(value?: string) {
  if (!value) return ''

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

export default function CategoryPosts({ category, initialPosts }: { category: string; initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const meta = categoryMeta[category] || { title: category, subtitle: category }

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
      publishedAt,
      _createdAt
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
    <section className="category-index">
      {posts.length ? (
        <div className="category-list" aria-label={`${meta.title} posts`}>
          {posts.map((post, index) => (
            <Link className="category-row" href={`/post/${post.slug.current}`} key={post.slug.current}>
              <span className="category-row-index">{formatIndex(index)}</span>
              <span className="category-row-main">
                <span className="category-row-meta">{meta.title} · {meta.subtitle}</span>
                <strong>{post.title}</strong>
                {post.excerpt && <em>{post.excerpt}</em>}
              </span>
              <time>{formatDate(post.publishedAt || post._createdAt)}</time>
            </Link>
          ))}
        </div>
      ) : (
        <div className="category-empty">— 暂无文章 —</div>
      )}
    </section>
  )
}
