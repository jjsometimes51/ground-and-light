'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from './adminAuth'
import { sanityFetch } from './sanity'
import { sanityMutate } from './sanityWrite'

function requiredId(formData: FormData) {
  const id = String(formData.get('_id') || '').trim()

  if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
    throw new Error('Invalid comment id')
  }

  return id
}

async function commentPaths(id: string) {
  const comment = await sanityFetch<{
    post?: {
      slug?: { current?: string }
      category?: string
    }
  } | null>(
    `*[_type == "comment" && _id == $id][0]{
      post->{slug, category}
    }`,
    { id }
  ).catch(() => null)
  const paths = ['/admin/comments']
  const slug = comment?.post?.slug?.current
  const category = comment?.post?.category?.toLowerCase()

  if (slug) paths.push(`/post/${slug}`)
  if (category) paths.push(`/${category}`)

  return paths
}

async function revalidateCommentPaths(id: string) {
  const paths = await commentPaths(id)
  paths.forEach(path => revalidatePath(path))
}

export async function approveComment(formData: FormData) {
  await requireAdminAuth()
  const id = requiredId(formData)

  await sanityMutate([
    {
      patch: {
        id,
        set: { status: 'approved' }
      }
    }
  ])

  await revalidateCommentPaths(id)
}

export async function deleteComment(formData: FormData) {
  await requireAdminAuth()
  const id = requiredId(formData)

  const paths = await commentPaths(id)
  await sanityMutate([{ delete: { id } }])

  paths.forEach(path => revalidatePath(path))
}
