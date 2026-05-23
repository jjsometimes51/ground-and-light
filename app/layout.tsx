import type { Metadata } from 'next'
import { site } from '../lib/site'
import VisitTracker from '../components/VisitTracker'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s | ${site.name}`
  },
  description: site.description,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: 'website'
  },
  icons: {
    icon: [
      { url: '/favicon-v2.png', sizes: '64x64', type: 'image/png' }
    ],
    shortcut: '/favicon-v2.png',
    apple: '/favicon-v2.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <VisitTracker />
      </body>
    </html>
  )
}
