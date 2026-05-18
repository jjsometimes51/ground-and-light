import Header from '../components/Header'
import { sanityFetch, urlFor, withTimeout } from '../lib/sanity'

type FeaturedPost = {
  title?: string
  slug?: { current?: string }
  coverImage?: any
}

async function getFeaturedPost(): Promise<FeaturedPost | null> {
  const featuredPost = sanityFetch<FeaturedPost | null>(
    `coalesce(
      *[
        _type == "post" &&
        featured == true &&
        coalesce(visibility, "public") == "public" &&
        (!defined(publishedAt) || publishedAt <= now())
      ] | order(coalesce(publishedAt, _createdAt) desc)[0]{
        title,
        slug,
        coverImage
      },
      *[_type == "siteSettings"][0]{
        featuredPost->{
          title,
          slug,
          coverImage
        }
      }.featuredPost
    )`
  ).catch(() => null)

  return withTimeout(featuredPost, null, 2500)
}

export default async function Home() {
  const featuredPost = await getFeaturedPost()
  const windowImage = featuredPost?.coverImage
    ? urlFor(featuredPost.coverImage).width(1400).height(1800).url()
    : '/images/home-window.jpg'

  return (
    <>
      <Header variant="home" />
      <main className="container home">
        <section className="hero">
          <div className="hero-composition">
            <p className="hero-slogan">{`Abide nowhere.
Let the mind flow freely.`}</p>
            <p className="hero-note">Notes on space, work, movement, and becoming.</p>
          </div>
          <aside className="hero-window" aria-label="Editorial image window">
            <div className="hero-window-fragment">
              <img
                src={windowImage}
                alt={featuredPost?.title || ''}
                className="hero-window-image"
              />
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}
