import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import AdminShell from '../AdminShell'

export const metadata: Metadata = {
  title: 'Admin Visits',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

export default async function AdminVisitsPage() {
  await requireAdminAuth()

  return (
    <AdminShell active="访客统计">
      <header className="admin-topbar">
        <h1>访客统计 <span>暂未接入</span></h1>
        <button className="admin-secondary-button" type="button">刷新</button>
      </header>

      <section className="admin-stat-grid admin-stat-grid-compact">
        <article className="admin-stat-card">
          <strong>—</strong>
          <span>累计访问量</span>
        </article>
        <article className="admin-stat-card">
          <strong>—</strong>
          <span>今日访问</span>
        </article>
        <article className="admin-stat-card">
          <strong>—</strong>
          <span>独立 IP 数</span>
        </article>
      </section>

      <div className="admin-placeholder-panel">
        <h2>统计功能下一步接入</h2>
        <p>现在网站部署在 Vercel，建议后面接入 Vercel Web Analytics 或一个轻量访问记录接口。页面结构先保留，之后数据接上就会显示访问时间、页面和来源。</p>
      </div>
    </AdminShell>
  )
}
