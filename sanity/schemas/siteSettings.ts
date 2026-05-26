import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Site title', type: 'string', initialValue: 'Ground & Light' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', initialValue: 'Abide nowhere. Let the mind flow freely.' }),
    defineField({
      name: 'featuredPost',
      title: 'Featured homepage post',
      type: 'reference',
      to: [{ type: 'post' }],
      description: 'Select the post that appears inside the framed homepage window.'
    }),
    defineField({
      name: 'about',
      title: 'About',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }, { type: 'file' }]
    })
  ]
})
