import Link from 'next/link'
import type { Metadata } from 'next'
import AdminShell from '../AdminShell'
import PostForm from '../PostForm'
import { updatePost } from '../../../lib/adminPosts'
import { requireAdminAuth } from '../../../lib/adminAuth'
import { sanityFetch, withTimeout } from '../../../lib/sanity'

export const metadata: Metadata = {
  title: 'Edit Post',
  robots: {
    index: false,
    follow: false
  }
}

export const dynamic = 'force-dynamic'

type EditablePost = {
  _id: string
  title?: string
  titleEn?: string
  slugText?: string
  slug?: { current?: string }
  language?: string
  category?: string
  excerpt?: string
  visibility?: string
  featured?: boolean
  publishedAt?: string
  body?: Array<{
    children?: Array<{ text?: string }>
  }>
}

function bodyToText(body?: EditablePost['body']) {
  return (body || [])
    .map(block => (block.children || []).map(child => child.text || '').join(''))
    .filter(Boolean)
    .join('\n\n')
}

export default async function EditPostPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdminAuth()

  const { id } = await searchParams
  const post = id ? await withTimeout(sanityFetch<EditablePost | null>(
    `*[_type == "post" && _id == $id][0]{
      _id,
      title,
      titleEn,
      slugText,
      slug,
      language,
      category,
      excerpt,
      visibility,
      featured,
      publishedAt,
      body[_type == "block"]{
        children[]{text}
      }
    }`,
    { id }
  ).catch(() => null), null, 5000) : null

  return (
    <AdminShell>
      <header className="admin-topbar">
        <h1>编辑文章</h1>
        <Link href="/admin" className="admin-secondary-button">返回列表</Link>
      </header>
      {post ? (
        <PostForm
          action={updatePost}
          post={{ ...post, bodyText: bodyToText(post.body) }}
          mode="edit"
          canSave={Boolean(process.env.SANITY_API_TOKEN)}
        />
      ) : (
        <div className="admin-empty">没有找到这篇文章。</div>
      )}
    </AdminShell>
  )
}
