import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import { sanityFetch } from '../../../lib/sanity'
import AdminShell from '../AdminShell'

export const metadata: Metadata = {
  title: 'Admin Visits',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

type Visit = {
  _id: string
  path: string
  ipHash?: string
  createdAt?: string
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export default async function AdminVisitsPage() {
  await requireAdminAuth()
  const visits = await sanityFetch<Visit[]>(`
    *[_type == "visit"] | order(createdAt desc)[0...120]{
      _id,
      path,
      ipHash,
      createdAt
    }
  `).catch(() => [])
  const today = todayPrefix()
  const todayVisits = visits.filter(visit => visit.createdAt?.startsWith(today))
  const uniqueIps = new Set(visits.map(visit => visit.ipHash).filter(Boolean)).size

  return (
    <AdminShell active="访客统计">
      <header className="admin-topbar">
        <h1>访客统计 <span>轻量匿名记录</span></h1>
        <a href="/admin/visits" className="admin-secondary-button">刷新</a>
      </header>

      <section className="admin-stat-grid admin-stat-grid-compact">
        <article className="admin-stat-card">
          <strong>{visits.length}</strong>
          <span>累计访问量</span>
        </article>
        <article className="admin-stat-card">
          <strong>{todayVisits.length}</strong>
          <span>今日访问</span>
        </article>
        <article className="admin-stat-card">
          <strong>{uniqueIps}</strong>
          <span>独立 IP 数</span>
        </article>
      </section>

      <div className="admin-table" role="table" aria-label="Recent visits">
        <div className="admin-row admin-row-head" role="row">
          <span>时间</span>
          <span>页面</span>
          <span>匿名 IP</span>
        </div>
        {visits.length === 0 ? (
          <div className="admin-empty">暂时没有访问记录。</div>
        ) : visits.map(visit => (
          <article className="admin-row admin-visit-row" role="row" key={visit._id}>
            <span className="admin-date">{formatDate(visit.createdAt)}</span>
            <strong>{visit.path}</strong>
            <span>{visit.ipHash || '—'}</span>
          </article>
        ))}
      </div>
    </AdminShell>
  )
}
