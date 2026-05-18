'use client'

import { useActionState } from 'react'
import { updateAbout } from '../../../lib/adminSettings'

export default function AboutForm({ settingsId, initialText, canSave }: { settingsId?: string, initialText: string, canSave: boolean }) {
  const [state, formAction, isPending] = useActionState(updateAbout, { status: 'idle' })

  return (
    <form action={formAction} className="admin-about-form">
      {settingsId && <input type="hidden" name="_id" value={settingsId} />}

      {!canSave && (
        <div className="admin-notice">
          还不能保存：需要在 Vercel 里添加 <code>SANITY_API_TOKEN</code>。
        </div>
      )}

      {state.status === 'error' && (
        <div className="admin-notice admin-notice-error">
          {state.message}
        </div>
      )}

      <label className="admin-field">
        <span>正文内容</span>
        <textarea name="about" rows={22} defaultValue={initialText} />
      </label>

      <div className="admin-form-actions">
        <button type="submit" disabled={!canSave || isPending}>
          {isPending ? '正在保存...' : '保存'}
        </button>
      </div>
    </form>
  )
}
