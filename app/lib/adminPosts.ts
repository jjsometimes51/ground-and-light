'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiVersion, dataset, projectId } from './sanity'

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

function requireToken() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Missing SANITY_API_TOKEN')
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

function bodyToBlocks(value: string): PortableTextBlock[] {
  return value
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => ({
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
    }))
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
    throw new Error(`Sanity mutation failed: ${response.status} ${text}`)
  }
}

function revalidateAdminAndSite(category?: string, slug?: string) {
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

export async function createPost(formData: FormData) {
  const title = requiredString(formData, 'title')
  const slugText = optionalString(formData, 'slugText') || title
  const slug = slugifyWithDate(slugText)
  const category = requiredString(formData, 'category')
  const visibility = requiredString(formData, 'visibility')
  const language = requiredString(formData, 'language')
  const publishedAt = optionalString(formData, 'publishedAt')
  const bodyText = String(formData.get('body') || '')

  await sanityMutate([
    {
      create: {
        _type: 'post',
        title,
        slugText,
        slug: { _type: 'slug', current: slug },
        language,
        category,
        visibility,
        excerpt: optionalString(formData, 'excerpt'),
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        body: bodyToBlocks(bodyText)
      }
    }
  ])

  revalidateAdminAndSite(category, slug)
  redirect('/admin')
}

export async function updatePost(formData: FormData) {
  const id = requiredString(formData, '_id')
  const title = requiredString(formData, 'title')
  const category = requiredString(formData, 'category')
  const visibility = requiredString(formData, 'visibility')
  const language = requiredString(formData, 'language')
  const publishedAt = optionalString(formData, 'publishedAt')
  const currentSlug = optionalString(formData, 'currentSlug')
  const slugText = optionalString(formData, 'slugText')
  const bodyText = String(formData.get('body') || '')
  const nextSlug = slugText ? slugifyWithDate(slugText) : currentSlug

  await sanityMutate([
    {
      patch: {
        id,
        set: {
          title,
          language,
          category,
          visibility,
          excerpt: optionalString(formData, 'excerpt'),
          publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
          body: bodyToBlocks(bodyText),
          ...(slugText ? {
            slugText,
            slug: { _type: 'slug', current: nextSlug }
          } : {})
        },
        unset: publishedAt ? [] : ['publishedAt']
      }
    }
  ])

  revalidateAdminAndSite(category, nextSlug)
  redirect('/admin')
}
