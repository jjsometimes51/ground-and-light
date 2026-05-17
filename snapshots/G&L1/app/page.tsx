import Header from '../components/Header'
import { client, urlFor } from '../lib/sanity'

type FeaturedPost = {
  title?: string
  slug?: { current?: string }
  coverImage?: any
}

async function getFeaturedPost(): Promise<FeaturedPost | null> {
  return client.fetch(
    `*[_type == "siteSettings"][0]{
      featuredPost->{
        title,
        slug,
        coverImage
      }
    }.featuredPost`
  ).catch(() => null)
}

export default async function Home() {
  const featuredPost = await getFeaturedPost()
  const windowImage = featuredPost?.coverImage
    ? urlFor(featuredPost.coverImage).width(1400).height(1800).url()
    : '/images/home-window.jpg'

  return (
    <>
      <Header />
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
