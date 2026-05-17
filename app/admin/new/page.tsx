import type { Metadata } from 'next'
import AdminShell from '../AdminShell'
import PostForm from '../PostForm'
import { createPost } from '../../../lib/adminPosts'
import { requireAdminAuth } from '../../../lib/adminAuth'

export const metadata: Metadata = {
  title: 'New Post',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  await requireAdminAuth()

  return (
    <AdminShell active="更新文章">
      <header className="admin-topbar">
        <h1>写新文章</h1>
      </header>
      <PostForm action={createPost} mode="create" canSave={Boolean(process.env.SANITY_API_TOKEN)} />
    </AdminShell>
  )
}
