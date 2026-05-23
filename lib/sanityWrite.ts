import { apiVersion, dataset, projectId } from './sanity'

export function requireSanityToken() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('Vercel 里还没有添加 SANITY_API_TOKEN，或者添加后还没有重新部署。')
  }

  return token
}

export async function sanityMutate(mutations: unknown[]) {
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireSanityToken()}`
      },
      body: JSON.stringify({ mutations })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sanity 保存失败：${response.status} ${text}`)
  }
}
