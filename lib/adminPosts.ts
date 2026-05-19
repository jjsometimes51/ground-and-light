'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiVersion, dataset, projectId } from './sanity'
import { requireAdminAuth } from './adminAuth'

export type AdminActionState = {
  status: 'idle' | 'error'
  message?: string
}

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

function requireToken() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Vercel 里还没有添加 SANITY_API_TOKEN，或者添加后还没有重新部署。')
  }

  return token
}

function key(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`
}

function slugifyWithDate(input: string) {
  const date = new Date().toISOString().slice(0, 10)
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!base) return date
  if (base.endsWith(date)) return base

  return `${base}-${date}`
}

function bodyToBlocks(value: string): Array<PortableTextBlock | PortableMediaBlock> {
  return value
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

function optionalString(formData: FormData, name: string) {
  const value = String(formData.get(name) || '').trim()
  return value || undefined
}

function requiredString(formData: FormData, name: string) {
  const value = optionalString(formData, name)

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function sanityMutate(mutations: unknown[]) {
  const token = requireToken()
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
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

  return { status: 'error', message: '发布失败：服务器没有返回具体错误。' }
}

function revalidateAdminAndSite(category?: string, slug?: string) {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/travel')
  revalidatePath('/notes')
  revalidatePath('/work')
  revalidatePath('/musings')

  if (category) {
    revalidatePath(`/${category.toLowerCase()}`)
  }

  if (slug) {
    revalidatePath(`/post/${slug}`)
  }
}

export async function createPost(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdminAuth()

  let category: string | undefined
  let slug: string | undefined

  try {
    const title = requiredString(formData, 'title')
    const slugText = optionalString(formData, 'slugText') || title
    slug = slugifyWithDate(slugText)
    category = requiredString(formData, 'category')
    const visibility = requiredString(formData, 'visibility')
    const postPassword = optionalString(formData, 'postPassword')
    if (visibility === 'password' && !postPassword) {
      throw new Error('选择“密码”可见性时，需要填写文章密码。')
    }
    const language = requiredString(formData, 'language')
    const publishedAt = optionalString(formData, 'publishedAt')
    const bodyText = String(formData.get('body') || '')
    const coverImageAssetId = optionalString(formData, 'coverImageAssetId')
    const featured = formData.get('featured') === 'on'

    await sanityMutate([
      ...(featured ? [{
        patch: {
          query: '*[_type == "post" && featured == true]',
          unset: ['featured']
        }
      }] : []),
      {
        create: {
          _type: 'post',
          title,
          titleEn: optionalString(formData, 'titleEn'),
          slugText,
          slug: { _type: 'slug', current: slug },
          language,
          category,
          visibility,
          postPassword: visibility === 'password' ? postPassword : undefined,
          featured,
          ...(coverImageAssetId ? {
            coverImage: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: coverImageAssetId
              }
            }
          } : {}),
          excerpt: optionalString(formData, 'excerpt'),
          publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
          body: bodyToBlocks(bodyText)
        }
      }
    ])
  } catch (error) {
    return actionError(error)
  }

  revalidateAdminAndSite(category, slug)
  redirect('/admin/posts')
}

export async function updatePost(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdminAuth()

  let category: string | undefined
  let nextSlug: string | undefined

  try {
    const id = requiredString(formData, '_id')
    const title = requiredString(formData, 'title')
    category = requiredString(formData, 'category')
    const visibility = requiredString(formData, 'visibility')
    const postPassword = optionalString(formData, 'postPassword')
    if (visibility === 'password' && !postPassword) {
      throw new Error('选择“密码”可见性时，需要填写文章密码。')
    }
    const language = requiredString(formData, 'language')
    const publishedAt = optionalString(formData, 'publishedAt')
    const currentSlug = optionalString(formData, 'currentSlug')
    const slugText = optionalString(formData, 'slugText')
    const bodyText = String(formData.get('body') || '')
    const coverImageAssetId = optionalString(formData, 'coverImageAssetId')
    const featured = formData.get('featured') === 'on'
    nextSlug = slugText ? slugifyWithDate(slugText) : currentSlug

    await sanityMutate([
      ...(featured ? [{
        patch: {
          query: `*[_type == "post" && _id != "${id}" && featured == true]`,
          unset: ['featured']
        }
      }] : []),
      {
        patch: {
          id,
          set: {
            title,
            titleEn: optionalString(formData, 'titleEn'),
            language,
            category,
            visibility,
            postPassword: visibility === 'password' ? postPassword : undefined,
            featured,
            ...(coverImageAssetId ? {
              coverImage: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: coverImageAssetId
                }
              }
            } : {}),
            excerpt: optionalString(formData, 'excerpt'),
            publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
            body: bodyToBlocks(bodyText),
            ...(slugText ? {
              slugText,
              slug: { _type: 'slug', current: nextSlug }
            } : {})
          },
          unset: [
            ...(publishedAt ? [] : ['publishedAt']),
            ...(visibility === 'password' && postPassword ? [] : ['postPassword'])
          ]
        },
      }
    ])
  } catch (error) {
    return actionError(error)
  }

  revalidateAdminAndSite(category, nextSlug)
  redirect('/admin/posts')
}

export async function deletePost(formData: FormData) {
  await requireAdminAuth()

  const id = requiredString(formData, '_id')

  await sanityMutate([
    {
      delete: {
        id
      }
    }
  ])

  revalidateAdminAndSite()
  redirect('/admin/posts')
}
