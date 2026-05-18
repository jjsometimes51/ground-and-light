import type { Metadata } from 'next'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import PostReader from '../../../components/PostReader'
import { sanityFetch, withTimeout } from '../../../lib/sanity'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await withTimeout(sanityFetch<any | null>(
    `*[
      _type == "post" &&
      slug.current == $slug &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") in ["public", "password"]
    ][0]{title, excerpt, slug}`,
    { slug }
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

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await withTimeout(sanityFetch<any | null>(
    `*[
      _type == "post" &&
      slug.current == $slug &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") in ["public", "password"]
    ][0]{
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
    { slug }
  ).catch(() => null), null, 10000)

  return (
    <>
      <Header active={post?.category} />
      <main className="container article">
        <PostReader slug={slug} initialPost={post} />
      </main>
      <Footer />
    </>
  )
}
