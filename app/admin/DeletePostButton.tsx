'use client'

import { deletePost } from '../../lib/adminPosts'

export default function DeletePostButton({ id, title }: { id: string, title: string }) {
  return (
    <form
      action={deletePost}
      onSubmit={event => {
        if (!window.confirm(`确定删除「${title}」吗？这个操作不能撤销。`)) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="_id" value={id} />
      <button type="submit" className="danger">删除</button>
    </form>
  )
}
