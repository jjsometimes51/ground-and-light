import Link from 'next/link'
import type { ReactNode } from 'react'
import { logoutFromAdmin } from '../../lib/adminAuth'

const menuItems = [
  ['01', '概览', '/admin'],
  ['02', '所有文章', '/admin/posts'],
  ['03', '写新文章', '/admin/new'],
  ['04', 'About', '/admin/about'],
  ['05', '访客统计', '/admin/visits'],
  ['06', '评论管理', '/admin/comments']
]

export default function AdminShell({ children, active = '所有文章' }: { children: ReactNode, active?: string }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span>Ground & Light</span>
          <small>ADMIN PANEL</small>
        </Link>
        <nav className="admin-menu" aria-label="Admin navigation">
          {menuItems.map(([icon, label, href]) => (
            <Link key={label} href={href} className={label === active ? 'active' : undefined}>
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/studio">高级设置</Link>
          <form action={logoutFromAdmin}>
            <button type="submit">退出后台</button>
          </form>
        </div>
      </aside>
      <section className="admin-content">
        {children}
      </section>
    </main>
  )
}
