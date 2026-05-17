import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import PostReader from '../../../components/PostReader'
import { sanityFetch, withTimeout } from '../../../lib/sanity'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await withTimeout(sanityFetch<any | null>(
    `*[
      _type == "post" &&
      slug.current == $slug &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") in ["public", "unlisted"]
    ][0]{
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
