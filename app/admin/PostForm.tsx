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

export default function PostForm({ action, post, mode, canSave }: PostFormProps) {
  return (
    <form action={action} className="admin-form">
      {post?._id && <input type="hidden" name="_id" value={post._id} />}
      {post?.slug?.current && <input type="hidden" name="currentSlug" value={post.slug.current} />}

      {!canSave && (
        <div className="admin-notice">
          还不能保存：需要在 Vercel 里添加 <code>SANITY_API_TOKEN</code>。界面可以先看，接好 token 后这里就能直接写入内容。
        </div>
      )}

      <label className="admin-field admin-field-wide">
        <span>标题</span>
        <input name="title" defaultValue={post?.title || ''} required placeholder="On the way back" />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>分类</span>
          <select name="category" defaultValue={post?.category || 'Notes'} required>
            <option value="Travel">Travel</option>
            <option value="Notes">Notes</option>
            <option value="Work">Work</option>
            <option value="Musings">Musings</option>
          </select>
        </label>

        <label className="admin-field">
          <span>可见性</span>
          <select name="visibility" defaultValue={post?.visibility || 'public'} required>
            <option value="public">公开</option>
            <option value="unlisted">隐藏</option>
            <option value="private">私密</option>
          </select>
        </label>

        <label className="admin-field">
          <span>语言</span>
          <select name="language" defaultValue={post?.language || 'en'} required>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>

        <label className="admin-field">
          <span>发布时间</span>
          <input name="publishedAt" type="datetime-local" defaultValue={datetimeLocal(post?.publishedAt)} />
        </label>
      </div>

      <label className="admin-field admin-field-wide">
        <span>Slug 基础文字</span>
        <input
          name="slugText"
          defaultValue={post?.slugText || ''}
          placeholder={mode === 'create' ? 'ronda / sunset / alhambra' : '留空则不修改现有 slug'}
        />
        <small>填写英文或拼音即可，系统会自动加当天日期，避免重复。</small>
      </label>

      <label className="admin-field admin-field-wide">
        <span>摘要</span>
        <textarea name="excerpt" rows={3} defaultValue={post?.excerpt || ''} />
      </label>

      <label className="admin-field admin-field-wide">
        <span>正文</span>
        <textarea name="body" rows={14} defaultValue={post?.bodyText || ''} />
      </label>

      <div className="admin-form-actions">
        <button type="submit" disabled={!canSave}>{mode === 'create' ? '发布文章' : '保存修改'}</button>
        <a href="/admin">取消</a>
      </div>
    </form>
  )
}
