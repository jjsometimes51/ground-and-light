'use client'

import { useEffect, useState } from 'react'
import PostContent from './PostContent'

type Post = {
  title: string
  category: string
  visibility?: string
  postPassword?: string
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
  visibility,
  postPassword,
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
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (initialPost) return

    const query = `*[
      _type == "post" &&
      slug.current == ${JSON.stringify(slug)} &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") in ["public", "password"]
    ][0]${postProjection}`
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`

    fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(payload => setPost(payload.result || null))
      .catch(() => setPost(null))
  }, [initialPost, slug])

  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(`ground-light-post-${slug}`) === 'unlocked')
  }, [slug])

  if (!post) return null

  if (post.visibility === 'password' && !unlocked) {
    return (
      <section className="password-gate" aria-label="Password protected post">
        <form
          className="password-card"
          onSubmit={event => {
            event.preventDefault()

            if (passwordValue === post.postPassword) {
              window.sessionStorage.setItem(`ground-light-post-${slug}`, 'unlocked')
              setUnlocked(true)
              setPasswordError('')
              return
            }

            setPasswordError('密码不正确，请再试一次。')
          }}
        >
          <p>这篇文章需要密码。</p>
          <input
            type="password"
            value={passwordValue}
            onChange={event => setPasswordValue(event.target.value)}
            placeholder="输入文章密码"
            aria-label="文章密码"
            required
          />
          {passwordError && <span>{passwordError}</span>}
          <button type="submit">进入文章</button>
        </form>
      </section>
    )
  }

  return <PostContent post={post} />
}
