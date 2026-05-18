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
  coverImage?: {
    asset?: {
      _id?: string
      _ref?: string
      url?: string
    }
  }
  publishedAt?: string
  body?: Array<{
    _type?: string
    asset?: {
      _id?: string
      _ref?: string
      url?: string
      mimeType?: string
      originalFilename?: string
    }
    children?: Array<{ text?: string }>
  }>
}

function bodyToText(body?: EditablePost['body']) {
  return (body || [])
    .map(block => {
      if (block._type === 'image' && block.asset?._ref) {
        return `![图片](sanity:${block.asset._ref})`
      }

      if (block._type === 'file' && block.asset?._ref) {
        const label = block.asset.mimeType?.startsWith('video/') ? '视频' : block.asset.mimeType?.startsWith('audio/') ? '音频' : '文件'
        return `[${label}: ${block.asset.originalFilename || 'media'}](sanity:${block.asset._ref})`
      }

      return (block.children || []).map(child => child.text || '').join('')
    })
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
      coverImage{
        asset->{_id, url}
      },
      publishedAt,
      body[]{
        _type,
        asset->{_id, url, mimeType, originalFilename},
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
          post={{
            ...post,
            coverImage: post.coverImage?.asset?._id ? {
              asset: {
                _ref: post.coverImage.asset._id,
                url: post.coverImage.asset.url
              }
            } : undefined,
            bodyText: bodyToText(post.body?.map(block => ({
              ...block,
              asset: block.asset?._id ? {
                _ref: block.asset._id,
                url: block.asset.url,
                mimeType: block.asset.mimeType,
                originalFilename: block.asset.originalFilename
              } : undefined
            }))) 
          }}
          mode="edit"
          canSave={Boolean(process.env.SANITY_API_TOKEN)}
        />
      ) : (
        <div className="admin-empty">没有找到这篇文章。</div>
      )}
    </AdminShell>
  )
}
