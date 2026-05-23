import type { Metadata } from 'next'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import PostReader from '../../../components/PostReader'
import { sanityFetch, withTimeout } from '../../../lib/sanity'

function cleanCategory(value?: string) {
  return ['Travel', 'Notes', 'Work', 'Musings'].includes(value || '') ? value : undefined
}

function cleanDocumentId(value?: string) {
  return value && /^[a-zA-Z0-9._-]+$/.test(value) ? value : undefined
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
  const post = await withTimeout(sanityFetch<any | null>(
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
  const post = await withTimeout(sanityFetch<any | null>(
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
    { slug, sourceCategory: sourceCategory || '', documentId: documentId || '' }
  ).catch(() => null), null, 10000)

  return (
    <>
      <Header active={post?.category} />
      <main className="container article">
        <PostReader slug={slug} sourceCategory={sourceCategory} documentId={documentId} initialPost={post} />
      </main>
      <Footer />
    </>
  )
}
