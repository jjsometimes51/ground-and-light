import Link from 'next/link'
import type { ReactNode } from 'react'
import { logoutFromAdmin } from '../../lib/adminAuth'

const menuItems = [
  ['•', '概览', '/admin'],
  ['✦', '所有文章', '/admin'],
  ['＋', '更新文章', '/admin/new'],
  ['⌕', 'About', '/about'],
  ['◒', '访客统计', '/admin'],
  ['※', '评论管理', '/admin']
]

export default function AdminShell({ children, active = '所有文章' }: { children: ReactNode, active?: string }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">Ground & Light</Link>
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
