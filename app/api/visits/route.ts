import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { sanityMutate } from '../../../lib/sanityWrite'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cleanPath(value: unknown) {
  const path = String(value || '').trim().slice(0, 240)
  if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/studio')) return ''
  return path
}

function cleanReferrer(value: unknown) {
  return String(value || '').trim().slice(0, 240)
}

function anonymousIpHash(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const salt = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'ground-light'

  return createHash('sha256')
    .update(`${ip}:${salt}`)
    .digest('hex')
    .slice(0, 16)
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const path = cleanPath(payload?.path)

  if (!path || !process.env.SANITY_API_TOKEN) {
    return NextResponse.json({ ok: true })
  }

  try {
    await sanityMutate([
      {
        create: {
          _type: 'visit',
          path,
          referrer: cleanReferrer(payload?.referrer),
          ipHash: anonymousIpHash(request),
          createdAt: new Date().toISOString()
        }
      }
    ])
  } catch {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
