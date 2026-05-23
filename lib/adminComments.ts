'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from './adminAuth'
import { sanityMutate } from './sanityWrite'

function requiredId(formData: FormData) {
  const id = String(formData.get('_id') || '').trim()

  if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
    throw new Error('Invalid comment id')
  }

  return id
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

  revalidatePath('/admin/comments')
}

export async function deleteComment(formData: FormData) {
  await requireAdminAuth()
  const id = requiredId(formData)

  await sanityMutate([{ delete: { id } }])

  revalidatePath('/admin/comments')
}
