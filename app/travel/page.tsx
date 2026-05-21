import CategoryPage from '../categoryPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel',
  description: 'Travel notes and observations from Ground & Light.',
  alternates: { canonical: '/travel' }
}

export default function Page() { return <CategoryPage category="Travel" /> }
