import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'visit',
  title: 'Visit',
  type: 'document',
  fields: [
    defineField({ name: 'path', title: 'Path', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'referrer', title: 'Referrer', type: 'string' }),
    defineField({ name: 'ipAddress', title: 'IP address', type: 'string' }),
    defineField({ name: 'ipHash', title: 'Anonymous IP hash', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created at', type: 'datetime', validation: Rule => Rule.required() })
  ],
  preview: {
    select: {
      title: 'path',
      subtitle: 'createdAt'
    }
  }
})
