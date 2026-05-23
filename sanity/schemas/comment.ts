import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'body',
      title: 'Comment',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required().max(1200)
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'pending',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'body',
      subtitle: 'status'
    }
  }
})
