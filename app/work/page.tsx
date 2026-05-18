import CategoryPage from '../categoryPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Work, practice, and process from Ground & Light.',
  alternates: { canonical: '/work' }
}

export default function Page() { return <CategoryPage category="Work" /> }
