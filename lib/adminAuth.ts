'use server'

import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const cookieName = 'ground_light_admin'

export type AdminLoginState = {
  status: 'idle' | 'error'
  message?: string
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || ''
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || adminPassword()
}

function sessionValue() {
  return createHash('sha256')
    .update(`${adminPassword()}:${sessionSecret()}`)
    .digest('hex')
}

export async function isAdminConfigured() {
  return Boolean(adminPassword())
}

export async function isAdminAuthenticated() {
  if (!(await isAdminConfigured())) return false

  const cookieStore = await cookies()
  return cookieStore.get(cookieName)?.value === sessionValue()
}

export async function requireAdminAuth() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login')
  }
}

export async function loginToAdmin(_prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  if (!(await isAdminConfigured())) {
    return {
      status: 'error',
      message: '还没有设置 ADMIN_PASSWORD。请先在 Vercel 环境变量里添加后台密码，然后重新部署。'
    }
  }

  const password = String(formData.get('password') || '')

  if (password !== adminPassword()) {
    return {
      status: 'error',
      message: '密码不对，再试一次。'
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(cookieName, sessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/admin',
    maxAge: 60 * 60 * 24 * 7
  })

  redirect('/admin')
}

export async function logoutFromAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(cookieName)
  redirect('/admin/login')
}
