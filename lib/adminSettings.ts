'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiVersion, dataset, projectId } from './sanity'
import { requireAdminAuth } from './adminAuth'
import type { AdminActionState } from './adminPosts'

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: Array<{
    _type: 'span'
    _key: string
    text: string
    marks: []
  }>
}

type PortableMediaBlock = {
  _type: 'image' | 'file'
  _key: string
  asset: {
    _type: 'reference'
    _ref: string
  }
}

function key(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`
}

function bodyToBlocks(value: string): Array<PortableTextBlock | PortableMediaBlock> {
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => {
      const imageMatch = paragraph.match(/^!\[([^\]]*)\]\(sanity:(image-[^)]+)\)$/)
      if (imageMatch) {
        return {
          _type: 'image',
          _key: key('i'),
          asset: {
            _type: 'reference',
            _ref: imageMatch[2]
          }
        }
      }

      const fileMatch = paragraph.match(/^\[([^\]]+)\]\(sanity:(file-[^)]+)\)$/)
      if (fileMatch) {
        return {
          _type: 'file',
          _key: key('f'),
          asset: {
            _type: 'reference',
            _ref: fileMatch[2]
          }
        }
      }

      return {
        _type: 'block',
        _key: key('b'),
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: key('s'),
            text: paragraph,
            marks: []
          }
        ]
      }
    })
}

function token() {
  const value = process.env.SANITY_API_TOKEN

  if (!value) {
    throw new Error('Vercel 里还没有添加 SANITY_API_TOKEN，或者添加后还没有重新部署。')
  }

  return value
}

async function sanityMutate(mutations: unknown[]) {
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`
      },
      body: JSON.stringify({ mutations })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sanity 保存失败：${response.status} ${text}`)
  }
}

function actionError(error: unknown): AdminActionState {
  if (error instanceof Error) {
    return { status: 'error', message: error.message }
  }

  return { status: 'error', message: '保存失败：服务器没有返回具体错误。' }
}

export async function updateAbout(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdminAuth()

  try {
    const id = 'siteSettings'
    const about = String(formData.get('about') || '')

    await sanityMutate([
      {
        createIfNotExists: {
          _id: id,
          _type: 'siteSettings',
          title: 'Ground & Light'
        }
      },
      {
        patch: {
          id,
          set: {
            about: bodyToBlocks(about)
          }
        }
      }
    ])
  } catch (error) {
    return actionError(error)
  }

  revalidatePath('/about')
  revalidatePath('/admin/about')
  redirect('/admin/about?saved=1')
}
