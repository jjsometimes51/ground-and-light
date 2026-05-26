'use client'

import { useActionState, useRef, useState } from 'react'
import { updateAbout } from '../../../lib/adminSettings'

export default function AboutForm({ settingsId, initialText, canSave }: { settingsId?: string, initialText: string, canSave: boolean }) {
  const [state, formAction, isPending] = useActionState(updateAbout, { status: 'idle' })
  const [aboutValue, setAboutValue] = useState(initialText)
  const [uploadMessage, setUploadMessage] = useState('')
  const aboutRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  function insertBlock(text: string) {
    const textarea = aboutRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const current = aboutValue
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n\n' : ''
    const insertion = `${prefix}${text}\n\n`
    const nextValue = `${current.slice(0, start)}${insertion}${current.slice(start)}`

    setAboutValue(nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + insertion.length, start + insertion.length)
    })
  }

  async function uploadFile(file: File) {
    setUploadMessage('正在上传...')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/admin/api/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    })
    const responseText = await response.text()
    let payload: any = null

    try {
      payload = responseText ? JSON.parse(responseText) : null
    } catch {
      payload = null
    }

    if (!response.ok) {
      throw new Error(payload?.error || responseText || '上传失败')
    }

    setUploadMessage('上传完成')
    return payload as {
      id: string
      mimeType: string
      filename: string
      kind: 'image' | 'file'
    }
  }

  async function handleUpload(file?: File, input?: HTMLInputElement | null) {
    if (!file) return

    try {
      const asset = await uploadFile(file)

      if (asset.kind === 'image') {
        insertBlock(`![${asset.filename || '图片'}](sanity:${asset.id})`)
        return
      }

      const label = asset.mimeType?.startsWith('video/') ? '视频' : asset.mimeType?.startsWith('audio/') ? '音频' : '文件'
      insertBlock(`[${label}: ${asset.filename || 'media'}](sanity:${asset.id})`)
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : '上传失败')
    } finally {
      if (input) input.value = ''
    }
  }

  return (
    <form action={formAction} className="admin-about-form">
      {settingsId && <input type="hidden" name="_id" value={settingsId} />}
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={event => handleUpload(event.target.files?.[0], event.currentTarget)} />
      <input ref={mediaInputRef} type="file" accept="video/*,audio/*" hidden onChange={event => handleUpload(event.target.files?.[0], event.currentTarget)} />

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

      <div className="admin-about-upload-panel" aria-label="About media tools">
        <div>
          <strong>插入媒体</strong>
          <span>从本地选择文件，上传成功后会自动插入到正文光标位置。</span>
        </div>
        <div className="admin-about-file-row">
          <label>
            <span>本地图片</span>
            <input type="file" accept="image/*" onChange={event => handleUpload(event.target.files?.[0], event.currentTarget)} />
          </label>
          <label>
            <span>本地音频/视频</span>
            <input type="file" accept="video/*,audio/*" onChange={event => handleUpload(event.target.files?.[0], event.currentTarget)} />
          </label>
        </div>
        <div className="admin-about-upload-actions">
          <button type="button" onClick={() => imageInputRef.current?.click()}>
            选择图片文件
          </button>
          <button type="button" onClick={() => mediaInputRef.current?.click()}>
            选择音频/视频
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="admin-upload-status">{uploadMessage}</div>
      )}

      <label className="admin-field">
        <span>正文内容</span>
        <textarea
          ref={aboutRef}
          name="about"
          rows={22}
          value={aboutValue}
          onChange={event => setAboutValue(event.target.value)}
        />
      </label>

      <div className="admin-form-actions">
        <button type="submit" disabled={!canSave || isPending}>
          {isPending ? '正在保存...' : '保存'}
        </button>
      </div>
    </form>
  )
}
