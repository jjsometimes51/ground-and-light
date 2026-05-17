import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch, withTimeout } from '../../lib/sanity'
import AdminShell from './AdminShell'

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false
  }
}

type AdminPost = {
  _id: string
  title?: string
  excerpt?: string
  category?: string
  visibility?: 'public' | 'unlisted' | 'private'
  publishedAt?: string
  _createdAt?: string
  slug?: { current?: string }
}

const visibilityLabels: Record<string, string> = {
  public: '公开',
  unlisted: '隐藏',
  private: '私密'
}

const categoryLabels: Record<string, string> = {
  Travel: '旅行笔记',
  Notes: '文章',
  Work: '工作',
  Musings: '随想'
}

function formatDate(value?: string) {
  if (!value) return '未定'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value)).replaceAll('/', '.')
}

function adminEditUrl(id: string) {
  return `/admin/edit?id=${encodeURIComponent(id.replace(/^drafts\./, ''))}`
}

const createPostUrl = '/admin/new'

export default async function AdminPage() {
  const posts = await withTimeout(sanityFetch<AdminPost[]>(
    `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc){
      _id,
      title,
      excerpt,
      category,
      visibility,
      publishedAt,
      _createdAt,
      slug
    }`
  ).catch(() => []), [], 5000)

  return (
    <AdminShell>
        <header className="admin-topbar">
          <h1>所有文章 <span>{posts.length} 篇</span></h1>
          <Link href={createPostUrl} className="admin-primary-button">+ 写新文章</Link>
        </header>

        <div className="admin-table" role="table" aria-label="Posts">
          <div className="admin-row admin-row-head" role="row">
            <span>标题</span>
            <span>推荐</span>
            <span>可见性</span>
            <span>分类</span>
            <span>日期</span>
            <span>操作</span>
          </div>

          {posts.map(post => (
            <article className="admin-row" role="row" key={post._id}>
              <div className="admin-title-cell">
                <strong>{post.title || 'Untitled'}</strong>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
              <span className="admin-feature">☆</span>
              <span>
                <mark className={`admin-pill visibility-${post.visibility || 'public'}`}>
                  {visibilityLabels[post.visibility || 'public']}
                </mark>
              </span>
              <span>
                <mark className="admin-pill category-pill">
                  {categoryLabels[post.category || ''] || post.category || '未分类'}
                </mark>
              </span>
              <span className="admin-date">{formatDate(post.publishedAt || post._createdAt)}</span>
              <span className="admin-actions">
                <Link href={adminEditUrl(post._id)}>编辑</Link>
                <Link href={adminEditUrl(post._id)} className="danger">删除</Link>
              </span>
            </article>
          ))}
        </div>
    </AdminShell>
  )
}
