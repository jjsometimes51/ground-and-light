import type { Metadata } from 'next'
import { requireAdminAuth } from '../../../lib/adminAuth'
import { sanityFetch } from '../../../lib/sanity'
import { approveComment, deleteComment } from '../../../lib/adminComments'
import AdminShell from '../AdminShell'

export const metadata: Metadata = {
  title: 'Admin Comments',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

type AdminComment = {
  _id: string
  body: string
  status: 'pending' | 'approved'
  createdAt?: string
  post?: {
    title?: string
    slug?: { current?: string }
  }
}

function formatDate(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export default async function AdminCommentsPage() {
  await requireAdminAuth()
  const comments = await sanityFetch<AdminComment[]>(`
    *[_type == "comment"] | order(createdAt desc)[0...80]{
      _id,
      body,
      status,
      createdAt,
      post->{title, slug}
    }
  `).catch(() => [])
  const pendingCount = comments.filter(comment => comment.status === 'pending').length

  return (
    <AdminShell active="评论管理">
      <header className="admin-topbar">
        <h1>评论管理 <span>{pendingCount} 条待审核</span></h1>
        <a href="/admin/comments" className="admin-secondary-button">刷新</a>
      </header>

      {comments.length === 0 ? (
        <div className="admin-comment-card">
          <p className="admin-kicker">Comments</p>
          <h2>暂时没有留言</h2>
          <p>文章页收到的新留言会先出现在这里，审核后才公开。</p>
        </div>
      ) : (
        <div className="admin-comment-list">
          {comments.map(comment => (
            <article className="admin-comment-item" key={comment._id}>
              <div>
                <p className="admin-kicker">{comment.status === 'pending' ? '待审核' : '已通过'} · {formatDate(comment.createdAt)}</p>
                <h2>{comment.post?.title || 'Untitled post'}</h2>
                <p>{comment.body}</p>
              </div>
              <div className="admin-actions">
                {comment.status !== 'approved' && (
                  <form action={approveComment}>
                    <input type="hidden" name="_id" value={comment._id} />
                    <button type="submit">通过</button>
                  </form>
                )}
                <form action={deleteComment}>
                  <input type="hidden" name="_id" value={comment._id} />
                  <button type="submit" className="danger">删除</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
