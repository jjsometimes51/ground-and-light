import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { client } from '../../lib/sanity'

export default async function AboutPage() {
  const settings = await client.fetch(`*[_type == "siteSettings"][0]{about}`).catch(() => null)
  return (
    <>
      <Header />
      <main className="container article">
        <h1>About</h1>
        <p>Builder. Observer.</p>
        <p>Interested in technology, people, and the structures that shape our lives.</p>
        {!settings?.about && <p>This page can be edited from /admin in Site Settings.</p>}
      </main>
      <Footer />
    </>
  )
}
