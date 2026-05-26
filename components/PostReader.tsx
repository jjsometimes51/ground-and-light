'use client'

import { useEffect, useState } from 'react'
import PostContent from './PostContent'

type Post = {
  _id?: string
  title: string
  category: string
  publishedAt?: string
  visibility?: string
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
  _id,
  title,
  category,
  visibility,
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

export default function PostReader({
  slug,
  sourceCategory,
  documentId,
  initialPost
}: {
  slug: string
  sourceCategory?: string
  documentId?: string
  initialPost: Post | null
}) {
  const [post, setPost] = useState(initialPost)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)

  useEffect(() => {
    if (initialPost) return

    const query = `*[
      _type == "post" &&
      (${JSON.stringify(documentId || '')} == "" || _id == ${JSON.stringify(documentId || '')}) &&
      (${JSON.stringify(documentId || '')} != "" || slug.current == ${JSON.stringify(slug)}) &&
      (${JSON.stringify(documentId || '')} != "" || ${JSON.stringify(sourceCategory || '')} == "" || category == ${JSON.stringify(sourceCategory || '')}) &&
      coalesce(visibility, "public") == "public"
    ][0]${postProjection}`
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`

    fetch(url)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(payload => setPost(payload.result || null))
      .catch(() => setPost(null))
  }, [initialPost, slug, sourceCategory, documentId])

  if (!post) return null

  if (post.visibility === 'password' && !post.body?.length) {
    return (
      <section className="password-gate" aria-label="Password protected post">
        <form
          className="password-card"
          onSubmit={async event => {
            event.preventDefault()
            setIsCheckingPassword(true)
            setPasswordError('')

            try {
              const response = await fetch('/api/post-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slug,
                  sourceCategory,
                  documentId,
                  password: passwordValue
                })
              })
              const payload = await response.json().catch(() => null)

              if (!response.ok || !payload?.post) {
                setPasswordError(payload?.error || '密码不正确，请再试一次。')
                return
              }

              setPost(payload.post)
            } catch {
              setPasswordError('验证失败，请稍后再试。')
            } finally {
              setIsCheckingPassword(false)
            }
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
          <button type="submit" disabled={isCheckingPassword}>
            {isCheckingPassword ? '正在验证...' : '进入文章'}
          </button>
        </form>
      </section>
    )
  }

  return <PostContent post={post} />
}
