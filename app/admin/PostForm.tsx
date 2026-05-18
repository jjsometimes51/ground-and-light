'use client'

import { useActionState, useRef } from 'react'
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
  featured?: boolean
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
  color: 'rgba(64, 78, 84, .72)',
  fontSize: '12px',
  fontWeight: 650
}

const controlStyle = {
  width: '100%',
  minHeight: '48px',
  border: '1px solid rgba(71, 94, 104, .18)',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, .56)',
  color: 'rgba(12, 16, 18, .88)',
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
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  function insertBodyText(before: string, after = '', placeholder = '文字') {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.slice(start, end) || placeholder
    const insertion = `${before}${selected}${after}`

    textarea.value = `${current.slice(0, start)}${insertion}${current.slice(end)}`
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
  }

  function insertBlock(text: string) {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const current = textarea.value
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n\n' : ''
    const insertion = `${prefix}${text}\n\n`

    textarea.value = `${current.slice(0, start)}${insertion}${current.slice(start)}`
    textarea.focus()
    textarea.setSelectionRange(start + insertion.length, start + insertion.length)
  }

  return (
    <form action={formAction} className="admin-form admin-editor-form" style={formStyle}>
      {post?._id && <input type="hidden" name="_id" value={post._id} />}
      {post?.slug?.current && <input type="hidden" name="currentSlug" value={post.slug.current} />}

      <div className="admin-editor-actions">
        <a href="/admin/posts">取消</a>
        <button type="submit" disabled={!canSave || isPending}>
          {isPending ? '正在保存...' : mode === 'create' ? '发布文章' : '保存修改'}
        </button>
      </div>

      <div className="admin-editor-toolbar" aria-label="Editor tools">
        <button type="button" onClick={() => insertBodyText('**', '**')}>B</button>
        <button type="button" onClick={() => insertBodyText('*', '*')}>/</button>
        <button type="button" onClick={() => insertBlock('## 小标题')}>H2</button>
        <button type="button" onClick={() => insertBlock('### 小标题')}>H3</button>
        <button type="button" onClick={() => insertBlock('> 引用内容')}>引用</button>
        <button type="button" onClick={() => insertBlock('---')}>分割线</button>
        <button type="button" onClick={() => insertBlock('![图片描述](https://example.com/image.jpg)')}>图片链接</button>
        <button type="button" onClick={() => insertBlock('![图片描述](上传图片后把链接放这里)')}>上传图片</button>
        <button type="button" onClick={() => insertBlock('[视频链接](上传视频后把链接放这里)')}>上传视频</button>
      </div>

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
          <select name="visibility" defaultValue={post?.visibility || 'public'} required style={controlStyle}>
            <option value="public">公开</option>
            <option value="unlisted">隐藏</option>
            <option value="private">私密</option>
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

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>Slug 基础文字</span>
        <input
          name="slugText"
          defaultValue={post?.slugText || ''}
          placeholder={mode === 'create' ? 'ronda / sunset / alhambra' : '留空则不修改现有 slug'}
          style={controlStyle}
        />
        <small style={{ color: 'rgba(77, 88, 92, .58)', fontSize: '12px', lineHeight: 1.45 }}>填写英文或拼音即可，系统会自动加当天日期，避免重复。</small>
      </label>

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>摘要</span>
        <textarea name="excerpt" rows={3} defaultValue={post?.excerpt || ''} style={textareaStyle} />
      </label>

      <div className="admin-editor-media">
        <div>
          <span>封面图（首页推荐卡片显示）</span>
          <button type="button">上传封面图</button>
        </div>
        <label>
          <input type="checkbox" name="featured" defaultChecked={Boolean(post?.featured)} />
          <span>设为首页推荐</span>
          <small>勾选后文章可用于首页右侧窗口</small>
        </label>
      </div>

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>正文</span>
        <textarea ref={bodyRef} name="body" rows={14} defaultValue={post?.bodyText || ''} style={textareaStyle} />
      </label>
    </form>
  )
}
