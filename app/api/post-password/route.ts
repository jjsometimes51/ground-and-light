import { NextResponse } from 'next/server'
import { apiVersion, dataset, projectId } from '../../../lib/sanity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cleanCategory(value?: unknown) {
  return ['Travel', 'Notes', 'Work', 'Musings'].includes(String(value || '')) ? String(value) : ''
}

function cleanDocumentId(value?: unknown) {
  const id = String(value || '')
  return /^[a-zA-Z0-9._-]+$/.test(id) ? id : ''
}

function cleanSlug(value?: unknown) {
  return String(value || '').slice(0, 180)
}

function readToken() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Missing SANITY_API_TOKEN')
  }

  return token
}

function resolveQuery(query: string, params: Record<string, string>) {
  return Object.entries(params).reduce((current, [key, value]) => {
    return current.replaceAll(`$${key}`, JSON.stringify(value))
  }, query)
}

async function sanityPrivateFetch<T>(query: string, params: Record<string, string>): Promise<T> {
  const resolvedQuery = resolveQuery(query, params)
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(resolvedQuery)}`
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${readToken()}`
    }
  })

  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status}`)
  }

  const payload = await response.json()
  return payload.result as T
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const password = String(payload?.password || '')
  const slug = cleanSlug(payload?.slug)
  const sourceCategory = cleanCategory(payload?.sourceCategory)
  const documentId = cleanDocumentId(payload?.documentId)

  if (!password || (!slug && !documentId)) {
    return NextResponse.json({ error: '密码不正确，请再试一次。' }, { status: 400 })
  }

  try {
    const post = await sanityPrivateFetch<any | null>(
      `*[
        _type == "post" &&
        ($documentId == "" || _id == $documentId) &&
        ($documentId != "" || slug.current == $slug) &&
        ($documentId != "" || $sourceCategory == "" || category == $sourceCategory) &&
        coalesce(visibility, "public") == "password"
      ][0]{
        _id,
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
      }`,
      { slug, sourceCategory, documentId }
    )

    if (!post || post.postPassword !== password) {
      return NextResponse.json({ error: '密码不正确，请再试一次。' }, { status: 403 })
    }

    const { postPassword: _postPassword, ...safePost } = post
    return NextResponse.json({ post: safePost })
  } catch {
    return NextResponse.json({ error: '验证失败，请稍后再试。' }, { status: 500 })
  }
}
