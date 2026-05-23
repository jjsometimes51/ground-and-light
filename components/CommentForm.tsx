'use client'

import { useState } from 'react'

export default function CommentForm({ postId }: { postId?: string }) {
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = body.trim()

    if (!postId || !trimmed) return

    setStatus('saving')
    setMessage('')

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, body: trimmed })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setStatus('error')
      setMessage(payload?.error || '留言没有发送成功，请稍后再试。')
      return
    }

    setBody('')
    setStatus('sent')
    setMessage('已收到。留言会先进入后台审核。')
  }

  if (!postId) return null

  return (
    <section className="comment-box" aria-label="Leave a note">
      <p>— Leave a note —</p>
      <form onSubmit={submitComment}>
        <textarea
          value={body}
          onChange={event => setBody(event.target.value)}
          maxLength={1200}
          placeholder="写下你的想法..."
          required
        />
        <button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? '发送中...' : '发送'}
        </button>
      </form>
      {message && <span className={status === 'error' ? 'comment-error' : 'comment-success'}>{message}</span>}
    </section>
  )
}
