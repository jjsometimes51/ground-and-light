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

function aboutText(blocks?: AboutSettings['about']) {
  return (blocks || [])
    .map(block => (block.children || []).map(child => child.text || '').join(''))
    .filter(Boolean)
    .join('\n\n')
}

function blocksToText(blocks?: AboutSettings['about']) {
  const text = aboutText(blocks)

  const isOldDefault = [
    'Builder. Observer.',
    'Interested in technology, people, and the structures that shape our lives.',
    'This page can be edited from /admin in Site Settings.'
  ].every(line => text.includes(line))

  return isOldDefault ? '' : text
}

function pickSettings(settings?: AboutSettings[] | null) {
  const candidates = settings || []
  const preferred = candidates.find(item => item._id === 'siteSettings' && blocksToText(item.about).trim())
    || candidates.find(item => blocksToText(item.about).trim())
    || candidates.find(item => item._id === 'siteSettings')

  return preferred || null
}

export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdminAuth()

  const { saved } = await searchParams
  const settingsList = await withTimeout(sanityFetch<AboutSettings[]>(
    `*[_type == "siteSettings"] | order(_updatedAt desc){
      _id,
      about[_type == "block"]{
        children[]{text}
      }
    }`
  ).catch(() => null), null, 5000)
  const settings = pickSettings(settingsList)

  return (
    <AdminShell active="About">
      <header className="admin-topbar admin-topbar-narrow">
        <div>
          <p className="admin-kicker">页面设置</p>
          <h1>内容编辑</h1>
        </div>
      </header>

      {saved && <div className="admin-notice admin-notice-success">已保存 About 页面。</div>}

      <AboutForm settingsId="siteSettings" initialText={blocksToText(settings?.about)} canSave={Boolean(process.env.SANITY_API_TOKEN)} />
    </AdminShell>
  )
}
