import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import AdminShell from '../AdminShell'

export const metadata: Metadata = {
  title: 'Admin Comments',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
  await requireAdminAuth()

  return (
    <AdminShell active="评论管理">
      <header className="admin-topbar">
        <h1>评论管理 <span>0 条</span></h1>
        <button className="admin-secondary-button" type="button">刷新</button>
      </header>

      <div className="admin-comment-card">
        <p className="admin-kicker">Comments</p>
        <h2>暂时没有评论系统</h2>
        <p>为了保持网站安静、轻量，评论功能还没有打开。等内容发布稳定后，可以再决定是否接入评论或只保留私密留言。</p>
      </div>
    </AdminShell>
  )
}
