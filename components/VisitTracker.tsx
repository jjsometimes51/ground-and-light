'use client'

import { useEffect } from 'react'

export default function VisitTracker() {
  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin') || path.startsWith('/studio') || path.startsWith('/api')) return

    const key = `ground-light-visit:${path}:${new Date().toISOString().slice(0, 10)}`
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')

    window.navigator.sendBeacon?.(
      '/api/visits',
      new Blob([JSON.stringify({
        path,
        referrer: document.referrer || ''
      })], { type: 'application/json' })
    )
  }, [])

  return null
}
