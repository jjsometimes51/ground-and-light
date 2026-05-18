import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import { sanityFetch, withTimeout } from '../../../lib/sanity'
import AdminShell from '../AdminShell'
import AdminPostTable, { type AdminPost } from '../AdminPostTable'

export const metadata: Metadata = {
  title: 'All Posts',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

export default async function AdminPostsPage() {
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

  return (
    <AdminShell active="所有文章">
      <header className="admin-topbar">
        <h1>所有文章 <span>{posts.length} 篇</span></h1>
        <Link href="/admin/new" className="admin-primary-button">+ 写新文章</Link>
      </header>

      <AdminPostTable posts={posts} label="All posts" />
    </AdminShell>
  )
}
