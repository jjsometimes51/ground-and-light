import CategoryPage from '../categoryPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Musings',
  description: 'Thoughts and reflections from Ground & Light.',
  alternates: { canonical: '/musings' }
}

export default function Page() { return <CategoryPage category="Musings" /> }
