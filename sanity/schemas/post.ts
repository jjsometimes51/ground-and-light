import { defineField, defineType } from 'sanity'

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

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({
      name: 'slugText',
      title: 'Slug text',
      type: 'string',
      description: 'Write a short English or pinyin base, for example: ronda. Then generate the slug to add today\'s date automatically.'
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Click Generate after filling Slug text. The date is added automatically, for example: ronda-2026-05-16.',
      options: {
        source: doc => String(doc.slugText || doc.title || ''),
        slugify: slugifyWithDate,
        maxLength: 96,
        isUnique: async (slug, context) => {
          const { document, getClient } = context
          const client = getClient({ apiVersion: '2026-05-12' })
          const id = document?._id.replace(/^drafts\./, '')
          const params = {
            draft: `drafts.${id}`,
            published: id,
            slug
          }

          const query = `!defined(*[
            _type == "post" &&
            slug.current == $slug &&
            !(_id in [$draft, $published])
          ][0]._id)`

          return client.fetch(query, params)
        }
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'en',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Chinese', value: 'zh' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: ['Travel', 'Notes', 'Work', 'Musings'] },
      validation: Rule => Rule.required()
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'coverImage', title: 'Cover image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'audio', title: 'Audio file', type: 'file', options: { accept: 'audio/*' } }),
    defineField({ name: 'video', title: 'Video file', type: 'file', options: { accept: 'video/*' } }),
    defineField({
      name: 'visibility',
      title: 'Visibility',
      type: 'string',
      description: 'Public appears in section listings. Unlisted is hidden from listings but available by direct URL. Private is hidden from the frontend for now.',
      initialValue: 'public',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Unlisted', value: 'unlisted' },
          { title: 'Private', value: 'private' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      description: 'Leave empty to publish immediately. Set a future time to hide the post until that time.'
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
        { type: 'file', title: 'Audio / Video / File' }
      ]
    })
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'coverImage' }
  }
})
