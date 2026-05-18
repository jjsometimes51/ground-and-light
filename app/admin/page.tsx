import type { Metadata } from 'next'
import { sanityFetch, withTimeout } from '../../lib/sanity'
import { requireAdminAuth } from '../../lib/adminAuth'
import AdminShell from './AdminShell'
import AdminPostTable, { type AdminPost } from './AdminPostTable'

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

function formatDate(value?: string) {
  if (!value) return '未定'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value)).replaceAll('/', '.')
}

const createPostUrl = '/admin/new'

export default async function AdminPage() {
  await requireAdminAuth()

  const posts = await withTimeout(sanityFetch<AdminPost[]>(
    `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc){
      _id,
      title,
      excerpt,
      category,
      visibility,
      featured,
      publishedAt,
      _createdAt,
      slug
    }`
  ).catch(() => []), [], 5000)
  const today = new Date().toISOString().slice(0, 10)
  const counts = {
    all: posts.length,
    notes: posts.filter(post => post.category === 'Notes').length,
    musings: posts.filter(post => post.category === 'Musings').length,
    travel: posts.filter(post => post.category === 'Travel').length
  }

  return (
    <AdminShell active="概览">
        <header className="admin-topbar">
          <h1>概览 <span>{formatDate(today)}</span></h1>
          <a href={createPostUrl} className="admin-primary-button">+ 写新文章</a>
        </header>

        <section className="admin-stat-grid" aria-label="Post summary">
          <article className="admin-stat-card">
            <strong>{counts.all}</strong>
            <span>总文章数</span>
          </article>
          <article className="admin-stat-card">
            <strong>{counts.notes}</strong>
            <span>文章</span>
            <small>Notes</small>
          </article>
          <article className="admin-stat-card">
            <strong>{counts.musings}</strong>
            <span>随想</span>
            <small>Musings</small>
          </article>
          <article className="admin-stat-card">
            <strong>{counts.travel}</strong>
            <span>旅行笔记</span>
            <small>Travel</small>
          </article>
        </section>

        <section className="admin-section">
          <h2>最近文章</h2>
          <AdminPostTable posts={posts.slice(0, 6)} label="Recent posts" />
        </section>
    </AdminShell>
  )
}
