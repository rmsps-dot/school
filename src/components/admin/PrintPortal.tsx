'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="print-portal-wrapper">
      {children}
    </div>,
    document.body
  )
}
