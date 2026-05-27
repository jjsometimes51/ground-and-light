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

async function queryExistingDocumentIds(token: string, baseId: string): Promise<string[]> {
  const query = '*[_id in $ids]._id'
  const params = { ids: [baseId, `drafts.${baseId}`] }
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&$ids=${encodeURIComponent(JSON.stringify(params.ids))}`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sanity 查询失败：${response.status} ${text}`)
  }

  const payload = await response.json()
  return Array.isArray(payload.result)
    ? payload.result.filter((value: unknown): value is string => typeof value === 'string')
    : []
}

async function sanityMutate(token: string, mutations: unknown[]) {
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
    throw new Error(`Sanity 操作失败：${response.status} ${text}`)
  }
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
    const existingIds: string[] = await queryExistingDocumentIds(token, baseId)
    const idsToRemoveReferencesFor = [baseId, `drafts.${baseId}`]

    if (existingIds.length > 0) {
      await sanityMutate(token, [
        {
          patch: {
            query: '*[_type == "siteSettings" && featuredPost._ref in $ids]',
            unset: ['featuredPost'],
            params: { ids: idsToRemoveReferencesFor }
          }
        },
        {
          delete: {
            query: '*[_type == "comment" && post._ref in $ids]',
            params: { ids: idsToRemoveReferencesFor }
          }
        },
        ...existingIds.map(existingId => ({
          delete: { id: existingId }
        }))
      ])
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
