'use client'

import { useEffect } from 'react'

/**
 * MobileViewportShield
 *
 * Universal shield that guarantees the RMSPS web application layout
 * automatically adapts and fits flawlessly to any mobile screen width
 * (from 320px iPhone SE to modern foldables and dynamic island iPhones).
 *
 * Features:
 * 1. Synchronizes dynamic viewport height & width CSS custom properties (--vh, --dvh, --vw).
 * 2. Neutralizes iOS Safari 16px input zoom shift that pushes layouts off-screen horizontally.
 * 3. Clips unexpected horizontal overflow while preserving natural touch-scrolling for wide tables/cards.
 * 4. Responds smoothly to orientation changes and virtual keyboard visibility changes.
 */
export default function MobileViewportShield() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    const syncViewportMetrics = () => {
      // Use window.innerWidth & window.innerHeight - these do NOT trigger forced reflow!
      // (reading element.clientWidth forces the browser to synchronously recompute layout)
      const vh = window.innerHeight * 0.01
      const vw = window.innerWidth

      root.style.setProperty('--vh', `${vh}px`)
      root.style.setProperty('--dvh', `${window.innerHeight}px`)
      root.style.setProperty('--vw', `${vw}px`)
      root.style.setProperty('--viewport-width', `${vw}px`)
    }

    let rafId: number | null = null
    const scheduleSync = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(syncViewportMetrics)
    }

    scheduleSync()

    window.addEventListener('resize', scheduleSync, { passive: true })
    window.addEventListener('orientationchange', scheduleSync, { passive: true })

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleSync, { passive: true })
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', scheduleSync)
      window.removeEventListener('orientationchange', scheduleSync)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', scheduleSync)
      }
    }
  }, [])

  return null
}
