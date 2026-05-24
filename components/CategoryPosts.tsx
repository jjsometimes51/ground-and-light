'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { urlFor } from '../lib/sanity'

type Post = {
  _id?: string
  title: string
  slug: { current: string }
  category: string
  excerpt?: string
  publishedAt?: string
  _createdAt?: string
  previewImage?: any
  bodyPreview?: Array<{
    _type?: string
    asset?: any
    children?: Array<{ text?: string }>
  }>
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

function postHref(post: Post, fallbackCategory: string) {
  const params = new URLSearchParams()
  const category = post.category || fallbackCategory

  if (category) params.set('category', category)
  if (post._id) params.set('id', post._id)

  const query = params.toString()
  return `/post/${post.slug.current}${query ? `?${query}` : ''}`
}

function imageFromPost(post: Post) {
  if (post.previewImage) return post.previewImage

  const imageBlock = post.bodyPreview?.find(block => block?._type === 'image' && block.asset)
  if (imageBlock) return imageBlock

  const text = post.bodyPreview
    ?.flatMap(block => block.children?.map(child => child.text || '') || [])
    .join('\n') || ''
  const markdownImage = text.match(/sanity:(image-[a-z0-9-]+)/i)

  if (!markdownImage) return null

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: markdownImage[1]
    }
  }
}

export default function CategoryPosts({ category, initialPosts }: { category: string; initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const meta = categoryMeta[category] || { title: category, subtitle: category }

  useEffect(() => {
    const query = `*[
      _type == "post" &&
      category == ${JSON.stringify(category)} &&
      coalesce(visibility, "public") != "private"
    ] | order(coalesce(publishedAt, _createdAt) desc){
      title,
      _id,
      slug,
      category,
      excerpt,
      publishedAt,
      _createdAt,
      "previewImage": coalesce(coverImage, body[_type == "image"][0]),
      "bodyPreview": body[]{
        _type,
        asset,
        children[]{text}
      }
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
          {posts.map((post, index) => {
            const image = imageFromPost(post)

            return (
              <Link
                className="category-row"
                href={postHref(post, category)}
                key={post._id || `${post.category}-${post.slug.current}`}
              >
                <span className="category-row-index">{formatIndex(index)}</span>
                <span className="category-row-main">
                  <span className="category-row-meta">{meta.title} · {meta.subtitle}</span>
                  <strong>{post.title}</strong>
                  {post.excerpt && <em>{post.excerpt}</em>}
                </span>
                {image && (
                  <span className="category-row-media" aria-hidden="true">
                    <img
                      alt=""
                      src={urlFor(image).width(520).height(340).fit('crop').auto('format').url()}
                    />
                  </span>
                )}
                <time>{formatDate(post.publishedAt || post._createdAt)}</time>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="category-empty">— 暂无文章 —</div>
      )}
    </section>
  )
}
