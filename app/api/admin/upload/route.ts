import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '../../../../lib/adminAuth'
import { apiVersion, dataset, projectId } from '../../../../lib/sanity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function token() {
  const value = process.env.SANITY_API_TOKEN

  if (!value) {
    throw new Error('Missing SANITY_API_TOKEN')
  }

  return value
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const kind = file.type.startsWith('image/') ? 'images' : 'files'
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = encodeURIComponent(file.name || 'upload')
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/assets/${kind}/${dataset}?filename=${filename}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        Authorization: `Bearer ${token()}`
      },
      body: buffer
    }
  )

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.message || payload?.error || 'Upload failed' },
      { status: response.status }
    )
  }

  const document = payload?.document

  return NextResponse.json({
    id: document?._id,
    url: document?.url,
    mimeType: document?.mimeType || file.type,
    filename: document?.originalFilename || file.name,
    kind: file.type.startsWith('image/') ? 'image' : 'file'
  })
}
