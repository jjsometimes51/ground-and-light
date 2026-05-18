import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import { sanityFetch, withTimeout } from '../../../lib/sanity'
import AdminShell from '../AdminShell'
import AboutForm from './AboutForm'

export const metadata: Metadata = {
  title: 'Admin About',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

type AboutSettings = {
  _id?: string
  about?: Array<{
    children?: Array<{ text?: string }>
  }>
}

function blocksToText(blocks?: AboutSettings['about']) {
  return (blocks || [])
    .map(block => (block.children || []).map(child => child.text || '').join(''))
    .filter(Boolean)
    .join('\n\n')
}

export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdminAuth()

  const { saved } = await searchParams
  const settings = await withTimeout(sanityFetch<AboutSettings | null>(
    `*[_type == "siteSettings"][0]{
      _id,
      about[_type == "block"]{
        children[]{text}
      }
    }`
  ).catch(() => null), null, 5000)

  return (
    <AdminShell active="About">
      <header className="admin-topbar admin-topbar-narrow">
        <h1>About</h1>
      </header>

      {saved && <div className="admin-notice admin-notice-success">已保存 About 页面。</div>}

      <AboutForm settingsId={settings?._id} initialText={blocksToText(settings?.about)} canSave={Boolean(process.env.SANITY_API_TOKEN)} />
    </AdminShell>
  )
}
