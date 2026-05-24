import Header from '../components/Header'
import Footer from '../components/Footer'
import CategoryPosts from '../components/CategoryPosts'
import { sanityFetch, withTimeout } from '../lib/sanity'

export default async function CategoryPage({ category }: { category: string }) {
  const posts = await withTimeout(sanityFetch<any[]>(
    `*[
      _type == "post" &&
      category == $category &&
      coalesce(visibility, "public") != "private"
    ] | order(coalesce(publishedAt, _createdAt) desc){
      _id,
      title,
      slug,
      category,
      excerpt,
      publishedAt,
      _createdAt,
      coverImage,
      "previewImage": coalesce(coverImage, body[_type == "image"][0]),
      "bodyPreview": body[]{
        _type,
        asset,
        children[]{text}
      },
      audio{asset->{url, mimeType, originalFilename}},
      video{asset->{url, mimeType, originalFilename}}
    }`,
    { category }
  ).catch(() => []), [], 10000)

  return (
    <>
      <Header active={category} />
      <main className="listing">
        <CategoryPosts category={category} initialPosts={posts || []} />
      </main>
      <Footer />
    </>
  )
}
