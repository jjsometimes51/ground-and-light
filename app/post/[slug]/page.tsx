import type { Metadata } from 'next'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import PostReader from '../../../components/PostReader'
import { apiVersion, dataset, projectId, sanityFetch, withTimeout } from '../../../lib/sanity'

function cleanCategory(value?: string) {
  return ['Travel', 'Notes', 'Work', 'Musings'].includes(value || '') ? value : undefined
}

function cleanDocumentId(value?: string) {
  return value && /^[a-zA-Z0-9._-]+$/.test(value) ? value : undefined
}

async function sanityServerFetch<T>(query: string, params: Record<string, string> = {}): Promise<T> {
  const resolvedQuery = Object.entries(params).reduce((current, [key, value]) => {
    return current.replaceAll(`$${key}`, JSON.stringify(value))
  }, query)
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(resolvedQuery)}`
  const headers: HeadersInit = {}

  if (process.env.SANITY_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SANITY_API_TOKEN}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  const response = await fetch(url, { cache: 'no-store', headers, signal: controller.signal }).finally(() => {
    clearTimeout(timeout)
  })

  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status}`)
  }

  const payload = await response.json()
  return payload.result as T
}

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ category?: string; id?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const sourceCategory = cleanCategory(resolvedSearchParams?.category)
  const documentId = cleanDocumentId(resolvedSearchParams?.id)
  const post = await withTimeout(sanityServerFetch<any | null>(
    `*[
      _type == "post" &&
      ($documentId == "" || _id == $documentId) &&
      ($documentId != "" || slug.current == $slug) &&
      ($documentId != "" || $sourceCategory == "" || category == $sourceCategory) &&
      coalesce(visibility, "public") in ["public", "password"]
    ][0]{title, excerpt, slug}`,
    { slug, sourceCategory: sourceCategory || '', documentId: documentId || '' }
  ).catch(() => null), null, 3000)

  if (!post?.title) {
    return {
      title: 'Post',
      alternates: { canonical: `/post/${slug}` }
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/post/${post.slug?.current || slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `/post/${post.slug?.current || slug}`
    }
  }
}

export default async function PostPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ category?: string; id?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const sourceCategory = cleanCategory(resolvedSearchParams?.category)
  const documentId = cleanDocumentId(resolvedSearchParams?.id)
  const postShell = await withTimeout(sanityServerFetch<any | null>(
    `*[
      _type == "post" &&
      ($documentId == "" || _id == $documentId) &&
      ($documentId != "" || slug.current == $slug) &&
      ($documentId != "" || $sourceCategory == "" || category == $sourceCategory) &&
      coalesce(visibility, "public") in ["public", "password"]
    ][0]{
      _id,
      title,
      category,
      visibility,
      excerpt,
      publishedAt
    }`,
    { slug, sourceCategory: sourceCategory || '', documentId: documentId || '' }
  ).catch(() => null), null, 8000)

  const post = postShell?.visibility === 'password' ? postShell : await withTimeout(sanityFetch<any | null>(
    `*[
      _type == "post" &&
      ($documentId == "" || _id == $documentId) &&
      ($documentId != "" || slug.current == $slug) &&
      ($documentId != "" || $sourceCategory == "" || category == $sourceCategory) &&
      coalesce(visibility, "public") == "public"
    ][0]{
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
    }`,
    { slug, sourceCategory: sourceCategory || '', documentId: documentId || '' }
  ).catch(() => null), null, 8000)
  const safePost = post?.visibility === 'password' ? {
    _id: post._id,
    title: post.title,
    category: post.category,
    visibility: post.visibility,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt
  } : post

  return (
    <>
      <Header active={post?.category} />
      <main className="container article">
        <PostReader slug={slug} sourceCategory={sourceCategory} documentId={documentId} initialPost={safePost} />
      </main>
      <Footer />
    </>
  )
}
