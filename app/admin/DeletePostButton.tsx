'use client'

import { useState } from 'react'

export default function DeletePostButton({ id, title }: { id: string, title: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <button
      type="button"
      className="danger"
      disabled={isDeleting}
      onClick={async () => {
        if (!window.confirm(`确定删除「${title}」吗？这个操作不能撤销。`)) {
          return
        }

        setIsDeleting(true)

        try {
          const response = await fetch('/admin/api/delete-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          })
          const payload = await response.json().catch(() => null)

          if (!response.ok) {
            throw new Error(payload?.error || '删除失败')
          }

          window.location.assign('/admin/posts?deleted=1')
        } catch (error) {
          alert(error instanceof Error ? error.message : '删除失败')
          setIsDeleting(false)
        }
      }}
    >
      {isDeleting ? '删除中' : '删除'}
    </button>
  )
}
