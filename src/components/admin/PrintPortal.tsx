'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PrintPortal({
  children,
  onReady,
}: {
  children: React.ReactNode
  onReady?: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && onReady) {
      const raf = requestAnimationFrame(() => {
        onReady()
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [mounted, onReady])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="print-portal-wrapper">
      {children}
    </div>,
    document.body
  )
}
