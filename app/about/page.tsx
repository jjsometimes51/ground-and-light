import Header from '../../components/Header'
import Footer from '../../components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Ground & Light.',
  alternates: { canonical: '/about' }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="container article" />
      <Footer />
    </>
  )
}
