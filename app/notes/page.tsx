import CategoryPage from '../categoryPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Notes on space, work, movement, and becoming.',
  alternates: { canonical: '/notes' }
}

export default function Page() { return <CategoryPage category="Notes" /> }
