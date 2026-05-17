import type { Metadata } from 'next'
import AdminShell from '../AdminShell'
import PostForm from '../PostForm'
import { createPost } from '../../../lib/adminPosts'

export const metadata: Metadata = {
  title: 'New Post',
  robots: {
    index: false,
    follow: false
  }
}

export default function NewPostPage() {
  return (
    <AdminShell active="更新文章">
      <header className="admin-topbar">
        <h1>写新文章</h1>
      </header>
      <PostForm action={createPost} mode="create" canSave={Boolean(process.env.SANITY_API_TOKEN)} />
    </AdminShell>
  )
}
