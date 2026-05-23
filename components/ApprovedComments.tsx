'use client'

import { useEffect, useState } from 'react'

type Comment = {
  _id: string
  body: string
  createdAt?: string
}

function formatDate(value?: string) {
  if (!value) return ''

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(value))
}

export default function ApprovedComments({ postId }: { postId?: string }) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (!postId) return

    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then(payload => setComments(Array.isArray(payload.comments) ? payload.comments : []))
      .catch(() => setComments([]))
  }, [postId])

  if (!postId || comments.length === 0) return null

  return (
    <section className="approved-comments" aria-label="Comments">
      <p>— Notes left here —</p>
      <div className="approved-comment-list">
        {comments.map(comment => (
          <article className="approved-comment" key={comment._id}>
            <p>{comment.body}</p>
            {comment.createdAt && <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>}
          </article>
        ))}
      </div>
    </section>
  )
}
