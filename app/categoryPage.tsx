import Header from '../components/Header'
import Footer from '../components/Footer'
import CategoryPosts from '../components/CategoryPosts'
import { sanityFetch, withTimeout } from '../lib/sanity'

export default async function CategoryPage({ category }: { category: string }) {
  const posts = await withTimeout(sanityFetch<any[]>(
    `*[
      _type == "post" &&
      category == $category &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") == "public"
    ] | order(coalesce(publishedAt, _createdAt) desc){
      title,
      slug,
      category,
      excerpt,
      coverImage,
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
