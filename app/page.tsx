import Link from 'next/link'
import Header from '../components/Header'
import { sanityFetch, urlFor, withTimeout } from '../lib/sanity'

type FeaturedPost = {
  title?: string
  slug?: { current?: string }
  coverImage?: any
  publishedAt?: string
  _createdAt?: string
}

async function getFeaturedPost(): Promise<FeaturedPost | null> {
  const featuredPost = sanityFetch<FeaturedPost | null>(
    `coalesce(
      *[
        _type == "post" &&
        featured == true &&
        coalesce(visibility, "public") != "private"
      ] | order(coalesce(publishedAt, _createdAt) desc)[0]{
        title,
        slug,
        coverImage,
        publishedAt,
        _createdAt
      },
      *[_type == "siteSettings"][0]{
        featuredPost->{
          title,
          slug,
          coverImage,
          publishedAt,
          _createdAt
        }
      }.featuredPost
    )`
  ).catch(() => null)

  return withTimeout(featuredPost, null, 2500)
}

function formatDate(value?: string) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

export default async function Home() {
  const featuredPost = await getFeaturedPost()
  const windowImage = featuredPost?.coverImage
    ? urlFor(featuredPost.coverImage).width(1400).height(1800).url()
    : '/images/home-window.jpg'
  const featuredDate = formatDate(featuredPost?.publishedAt || featuredPost?._createdAt)

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
            {featuredPost?.slug?.current ? (
              <Link
                href={`/post/${featuredPost.slug.current}`}
                className="hero-window-feature"
                style={{ backgroundImage: `url(${windowImage})` }}
              >
                <span className="hero-window-label">Featured</span>
                <span className="hero-window-text">
                  <strong>{featuredPost.title}</strong>
                  {featuredDate && <time>{featuredDate}</time>}
                </span>
              </Link>
            ) : (
              <div className="hero-window-fragment">
                <img
                  src={windowImage}
                  alt=""
                  className="hero-window-image"
                />
              </div>
            )}
          </aside>
        </section>
      </main>
    </>
  )
}
