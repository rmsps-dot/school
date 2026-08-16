'use client'

import { createPortal } from 'react-dom'

export default function PrintPortal({
  children,
}: {
  children: React.ReactNode
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="print-portal-wrapper">
      {children}
    </div>,
    document.body
  )
}
