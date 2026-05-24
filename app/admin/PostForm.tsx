'use client'

import { useActionState, useRef, useState } from 'react'
import type { AdminActionState } from '../../lib/adminPosts'

type AdminEditablePost = {
  _id?: string
  title?: string
  titleEn?: string
  slugText?: string
  slug?: { current?: string }
  language?: string
  category?: string
  excerpt?: string
  visibility?: string
  postPassword?: string
  featured?: boolean
  coverImage?: {
    asset?: {
      _ref?: string
      url?: string
    }
  }
  publishedAt?: string
  bodyText?: string
}

type PostFormProps = {
  action: (prevState: AdminActionState, formData: FormData) => Promise<AdminActionState>
  post?: AdminEditablePost
  mode: 'create' | 'edit'
  canSave: boolean
}

function datetimeLocal(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

const formStyle = {
  maxWidth: '900px',
  display: 'grid',
  gap: '18px',
  padding: '28px',
  border: '1px solid rgba(106, 132, 142, .13)',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, .24)',
  boxShadow: '0 16px 42px rgba(35, 63, 75, .035)'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '14px'
}

const fieldStyle = {
  display: 'grid',
  gap: '8px'
}

const labelTextStyle = {
  color: 'rgba(27, 39, 43, .82)',
  fontSize: '12px',
  fontWeight: 650
}

const controlStyle = {
  width: '100%',
  minHeight: '48px',
  border: '1px solid rgba(71, 94, 104, .18)',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, .78)',
  color: 'rgba(8, 13, 15, .94)',
  font: 'inherit',
  fontSize: '14px',
  padding: '0 14px'
}

const textareaStyle = {
  ...controlStyle,
  minHeight: undefined,
  padding: '14px',
  lineHeight: 1.65,
  resize: 'vertical' as const
}

const noticeStyle = {
  padding: '14px 16px',
  border: '1px solid rgba(179, 130, 42, .2)',
  borderRadius: '6px',
  background: 'rgba(247, 234, 194, .42)',
  color: 'rgba(105, 74, 22, .9)',
  fontSize: '13px',
  lineHeight: 1.55
}

export default function PostForm({ action, post, mode, canSave }: PostFormProps) {
  const [state, formAction, isPending] = useActionState(action, { status: 'idle' } as AdminActionState)
  const [bodyValue, setBodyValue] = useState(post?.bodyText || '')
  const [visibilityValue, setVisibilityValue] = useState(post?.visibility || 'public')
  const [coverImageAssetId, setCoverImageAssetId] = useState(post?.coverImage?.asset?._ref || '')
  const [coverImageName, setCoverImageName] = useState(post?.coverImage?.asset?.url ? '已选择封面图' : '')
  const [uploadMessage, setUploadMessage] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  function insertBodyText(before: string, after = '', placeholder = '文字') {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = bodyValue
    const selected = current.slice(start, end) || placeholder
    const insertion = `${before}${selected}${after}`
    const nextValue = `${current.slice(0, start)}${insertion}${current.slice(end)}`

    setBodyValue(nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  function insertBlock(text: string) {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const current = bodyValue
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n\n' : ''
    const insertion = `${prefix}${text}\n\n`
    const nextValue = `${current.slice(0, start)}${insertion}${current.slice(start)}`

    setBodyValue(nextValue)
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
      const message = payload?.error || responseText || '上传失败'
      if (message.toLowerCase().includes('request entity too large')) {
        throw new Error('文件太大，服务器拒绝接收。请先压缩图片/视频后再上传。')
      }
      throw new Error(message)
    }

    setUploadMessage('上传完成')
    return payload as {
      id: string
      url: string
      mimeType: string
      filename: string
      kind: 'image' | 'file'
    }
  }

  async function handleCoverUpload(file?: File) {
    if (!file) return

    try {
      const asset = await uploadFile(file)
      if (asset.kind !== 'image') {
        setUploadMessage('封面图只能上传图片文件。')
        return
      }

      setCoverImageAssetId(asset.id)
      setCoverImageName(asset.filename || '已选择封面图')
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : '上传失败')
    }
  }

  async function handleBodyUpload(file?: File) {
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
    }
  }

  return (
    <form action={formAction} className="admin-form admin-editor-form" style={formStyle}>
      {post?._id && <input type="hidden" name="_id" value={post._id} />}
      {post?.slug?.current && <input type="hidden" name="currentSlug" value={post.slug.current} />}
      <input type="hidden" name="timezoneOffset" value={new Date().getTimezoneOffset()} />
      <input type="hidden" name="coverImageAssetId" value={coverImageAssetId} />
      <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={event => handleCoverUpload(event.target.files?.[0])} />
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={event => handleBodyUpload(event.target.files?.[0])} />
      <input ref={videoInputRef} type="file" accept="video/*,audio/*" hidden onChange={event => handleBodyUpload(event.target.files?.[0])} />

      <div className="admin-editor-actions">
        <a href="/admin/posts">取消</a>
        <button type="submit" disabled={!canSave || isPending}>
          {isPending ? '正在保存...' : mode === 'create' ? '发布文章' : '保存修改'}
        </button>
      </div>

      <div className="admin-editor-toolbar" aria-label="Editor tools">
        <span className="admin-toolbar-group">
          <button type="button" onClick={() => insertBodyText('**', '**')}>B</button>
          <button type="button" onClick={() => insertBodyText('*', '*')}>/</button>
          <button type="button" onClick={() => insertBlock('## 小标题')}>H2</button>
          <button type="button" onClick={() => insertBlock('### 小标题')}>H3</button>
        </span>
        <span className="admin-toolbar-group">
          <button type="button" onClick={() => insertBlock('> 引用内容')}>引用</button>
          <button type="button" onClick={() => insertBlock('---')}>分割线</button>
        </span>
        <span className="admin-toolbar-group admin-toolbar-upload">
          <button type="button" onClick={() => imageInputRef.current?.click()}>上传图片</button>
          <button type="button" onClick={() => videoInputRef.current?.click()}>上传视频/音频</button>
        </span>
      </div>

      {uploadMessage && (
        <div className="admin-upload-status">{uploadMessage}</div>
      )}

      {!canSave && (
        <div className="admin-notice" style={noticeStyle}>
          还不能保存：需要在 Vercel 里添加 <code>SANITY_API_TOKEN</code>。界面可以先看，接好 token 后这里就能直接写入内容。
        </div>
      )}

      {state.status === 'error' && (
        <div className="admin-notice" style={{ ...noticeStyle, borderColor: 'rgba(164, 61, 42, .22)', background: 'rgba(247, 218, 209, .42)', color: 'rgba(118, 38, 24, .92)' }}>
          {state.message}
        </div>
      )}

      <div className="admin-editor-two">
        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>标题（中文）</span>
          <input name="title" defaultValue={post?.title || ''} required placeholder="文章标题" style={controlStyle} />
        </label>

        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>TITLE (ENGLISH)</span>
          <input name="titleEn" defaultValue={post?.titleEn || ''} placeholder="Article title in English" style={controlStyle} />
        </label>
      </div>

      <div className="admin-form-grid" style={gridStyle}>
        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>分类</span>
          <select name="category" defaultValue={post?.category || 'Notes'} required style={controlStyle}>
            <option value="Travel">Travel</option>
            <option value="Notes">Notes</option>
            <option value="Work">Work</option>
            <option value="Musings">Musings</option>
          </select>
        </label>

        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>可见性</span>
          <select
            name="visibility"
            value={visibilityValue}
            onChange={event => setVisibilityValue(event.target.value)}
            required
            style={controlStyle}
          >
            <option value="public">公开</option>
            <option value="private">隐私</option>
            <option value="password">密码</option>
          </select>
        </label>

        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>发布时间</span>
          <input name="publishedAt" type="datetime-local" defaultValue={datetimeLocal(post?.publishedAt)} style={controlStyle} />
        </label>

        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>语言</span>
          <select name="language" defaultValue={post?.language || 'en'} required style={controlStyle}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </div>

      {visibilityValue === 'password' && (
        <label className="admin-field admin-field-wide" style={fieldStyle}>
          <span style={labelTextStyle}>文章密码</span>
          <input
            name="postPassword"
            defaultValue={post?.postPassword || ''}
            placeholder="给这篇文章设置一个单独密码"
            required
            style={controlStyle}
          />
          <small style={{ color: 'rgba(77, 88, 92, .58)', fontSize: '12px', lineHeight: 1.45 }}>
            只有选择“密码”时需要填写。每篇文章可以使用不同密码。
          </small>
        </label>
      )}

      <div className="admin-editor-compact-row admin-editor-summary-row">
        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>摘要</span>
          <textarea
            name="excerpt"
            rows={1}
            defaultValue={post?.excerpt || ''}
            style={{ ...textareaStyle, minHeight: '48px', height: '48px', padding: '12px 14px' }}
          />
        </label>
      </div>

      <details className="admin-advanced-options">
        <summary>链接选项（可选）</summary>
        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>Slug 基础文字</span>
          <input
            name="slugText"
            defaultValue={post?.slugText || ''}
            placeholder={mode === 'create' ? '可不填，系统会根据标题和日期自动生成' : '留空则不修改现有链接'}
            style={controlStyle}
          />
          <small style={{ color: 'rgba(45, 58, 62, .72)', fontSize: '12px', lineHeight: 1.45 }}>
            只有想手动控制文章链接时才需要填写。新文章不填时，系统会根据标题和日期自动生成。
          </small>
        </label>
      </details>

      <div className="admin-editor-media admin-feature-panel">
        <div>
          <span>封面图（首页推荐卡片显示）</span>
          <button type="button" onClick={() => coverInputRef.current?.click()}>上传封面图</button>
          {coverImageName && <small>{coverImageName}</small>}
        </div>
        <label>
          <input type="checkbox" name="featured" defaultChecked={Boolean(post?.featured)} />
          <span>设为首页唯一推荐</span>
          <small>首页窗户只显示一篇文章。保存后，其他文章会自动取消推荐。</small>
        </label>
      </div>

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>正文</span>
        <textarea
          ref={bodyRef}
          name="body"
          rows={14}
          value={bodyValue}
          onChange={event => setBodyValue(event.target.value)}
          style={textareaStyle}
        />
      </label>
    </form>
  )
}
