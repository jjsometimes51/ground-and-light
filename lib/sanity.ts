import { createClient } from 'next-sanity'
import { createImageUrlBuilder } from '@sanity/image-url'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-05-12'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false
})

const builder = createImageUrlBuilder(client)
export function urlFor(source: any) {
  return builder.image(source)
}

export function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      setTimeout(() => resolve(fallback), ms)
    })
  ])
}

export async function sanityFetch<T>(query: string, params: Record<string, string> = {}): Promise<T> {
  const resolvedQuery = Object.entries(params).reduce((current, [key, value]) => {
    return current.replaceAll(`$${key}`, JSON.stringify(value))
  }, query)
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(resolvedQuery)}`
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status}`)
  }

  const payload = await response.json()
  return payload.result as T
}
