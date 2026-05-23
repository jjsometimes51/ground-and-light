import { NextResponse } from 'next/server'
import { sanityMutate } from '../../../lib/sanityWrite'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cleanPostId(value: unknown) {
  const postId = String(value || '').trim()
  return /^[a-zA-Z0-9._-]+$/.test(postId) ? postId : ''
}

function cleanBody(value: unknown) {
  return String(value || '')
    .replace(/\s+\n/g, '\n')
    .trim()
    .slice(0, 1200)
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const postId = cleanPostId(payload?.postId)
  const body = cleanBody(payload?.body)

  if (!postId || !body) {
    return NextResponse.json({ error: '留言内容不完整。' }, { status: 400 })
  }

  try {
    await sanityMutate([
      {
        create: {
          _type: 'comment',
          post: {
            _type: 'reference',
            _ref: postId
          },
          body,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      }
    ])
  } catch {
    return NextResponse.json({ error: '留言暂时无法保存。' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
