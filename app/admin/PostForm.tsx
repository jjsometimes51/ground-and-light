type AdminEditablePost = {
  _id?: string
  title?: string
  slugText?: string
  slug?: { current?: string }
  language?: string
  category?: string
  excerpt?: string
  visibility?: string
  publishedAt?: string
  bodyText?: string
}

type PostFormProps = {
  action: (formData: FormData) => Promise<void>
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
  maxWidth: '980px',
  display: 'grid',
  gap: '18px',
  padding: '22px',
  border: '1px solid rgba(106, 132, 142, .13)',
  background: 'rgba(255, 255, 255, .2)',
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
  minHeight: '42px',
  border: '1px solid rgba(71, 94, 104, .18)',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, .48)',
  color: 'rgba(12, 16, 18, .88)',
  font: 'inherit',
  fontSize: '14px',
  padding: '0 12px'
}

const textareaStyle = {
  ...controlStyle,
  minHeight: undefined,
  padding: '12px',
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
  return (
    <form action={action} className="admin-form" style={formStyle}>
      {post?._id && <input type="hidden" name="_id" value={post._id} />}
      {post?.slug?.current && <input type="hidden" name="currentSlug" value={post.slug.current} />}

      {!canSave && (
        <div className="admin-notice" style={noticeStyle}>
          还不能保存：需要在 Vercel 里添加 <code>SANITY_API_TOKEN</code>。界面可以先看，接好 token 后这里就能直接写入内容。
        </div>
      )}

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>标题</span>
        <input name="title" defaultValue={post?.title || ''} required placeholder="On the way back" style={controlStyle} />
      </label>

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
          <span style={labelTextStyle}>语言</span>
          <select name="language" defaultValue={post?.language || 'en'} required style={controlStyle}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>

        <label className="admin-field" style={fieldStyle}>
          <span style={labelTextStyle}>发布时间</span>
          <input name="publishedAt" type="datetime-local" defaultValue={datetimeLocal(post?.publishedAt)} style={controlStyle} />
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

      <label className="admin-field admin-field-wide" style={fieldStyle}>
        <span style={labelTextStyle}>正文</span>
        <textarea name="body" rows={14} defaultValue={post?.bodyText || ''} style={textareaStyle} />
      </label>

      <div className="admin-form-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '6px' }}>
        <button
          type="submit"
          disabled={!canSave}
          style={{
            minHeight: '38px',
            padding: '0 16px',
            border: 0,
            borderRadius: '5px',
            background: 'rgba(8, 13, 19, .94)',
            color: 'rgba(255, 255, 255, .92)',
            opacity: canSave ? 1 : .45
          }}
        >
          {mode === 'create' ? '发布文章' : '保存修改'}
        </button>
        <a href="/admin" style={{ color: 'rgba(77, 88, 92, .72)', fontSize: '13px' }}>取消</a>
      </div>
    </form>
  )
}
