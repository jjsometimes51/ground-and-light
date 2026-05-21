import type { MetadataRoute } from 'next'
import { sanityFetch } from '../lib/sanity'
import { site } from '../lib/site'

type SitemapPost = {
  slug?: { current?: string }
  _updatedAt?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/travel', '/notes', '/work', '/musings', '/about'].map(path => ({
    url: `${site.url}${path}`,
    lastModified: new Date()
  }))

  const posts = await sanityFetch<SitemapPost[]>(
    `*[
      _type == "post" &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      coalesce(visibility, "public") == "public"
    ]{slug, _updatedAt}`
  ).catch(() => [])

  const postRoutes = posts
    .filter(post => post.slug?.current)
    .map(post => ({
      url: `${site.url}/post/${post.slug!.current}`,
      lastModified: post._updatedAt ? new Date(post._updatedAt) : new Date()
    }))

  return [...staticRoutes, ...postRoutes]
}
