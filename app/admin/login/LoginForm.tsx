'use client'

import { useActionState } from 'react'
import { loginToAdmin } from '../../../lib/adminAuth'

export default function LoginForm({ canLogin }: { canLogin: boolean }) {
  const [state, formAction, isPending] = useActionState(loginToAdmin, { status: 'idle' })

  return (
    <form action={formAction} className="admin-login-card">
      <p className="admin-login-kicker">Ground & Light</p>
      <h1>后台登录</h1>
      <p>输入后台密码后继续编辑文章。</p>

      {!canLogin && (
        <div className="admin-notice">
          还没有设置 <code>ADMIN_PASSWORD</code>。请先在 Vercel 环境变量里添加后台密码，然后重新部署。
        </div>
      )}

      {state.status === 'error' && (
        <div className="admin-notice admin-notice-error">
          {state.message}
        </div>
      )}

      <label className="admin-field">
        <span>密码</span>
        <input name="password" type="password" required disabled={!canLogin || isPending} autoFocus />
      </label>

      <button type="submit" disabled={!canLogin || isPending}>
        {isPending ? '正在进入...' : '进入后台'}
      </button>
    </form>
  )
}
