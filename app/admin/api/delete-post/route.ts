import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '../../../../lib/adminAuth'
import { apiVersion, dataset, projectId } from '../../../../lib/sanity'

export const dynamic = 'force-dynamic'

function cleanDocumentId(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value) ? value : undefined
}

function requireToken() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Vercel 里还没有添加 SANITY_API_TOKEN，或者添加后还没有重新部署。')
  }

  return token
}

function revalidateAdminAndSite() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
  revalidatePath('/travel')
  revalidatePath('/notes')
  revalidatePath('/work')
  revalidatePath('/musings')
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth()
    const payload = await request.json().catch(() => null)
    const id = cleanDocumentId(payload?.id)

    if (!id) {
      return NextResponse.json({ error: '缺少文章 ID。' }, { status: 400 })
    }

    const baseId = id.replace(/^drafts\./, '')
    const token = requireToken()
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mutations: [
            { delete: { id: baseId } },
            { delete: { id: `drafts.${baseId}` } }
          ]
        })
      }
    )

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: `Sanity 删除失败：${response.status} ${text}` }, { status: 500 })
    }

    revalidateAdminAndSite()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败。' },
      { status: 500 }
    )
  }
}
