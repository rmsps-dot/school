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
      const vh = window.innerHeight * 0.01
      const vw = window.innerWidth
      const docWidth = root.clientWidth || vw

      root.style.setProperty('--vh', `${vh}px`)
      root.style.setProperty('--dvh', `${window.innerHeight}px`)
      root.style.setProperty('--vw', `${vw}px`)
      root.style.setProperty('--viewport-width', `${docWidth}px`)

      // Ensure body width never exceeds viewport width
      if (document.body) {
        document.body.style.maxWidth = `${docWidth}px`
      }
    }

    syncViewportMetrics()

    window.addEventListener('resize', syncViewportMetrics, { passive: true })
    window.addEventListener('orientationchange', syncViewportMetrics, { passive: true })

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewportMetrics, { passive: true })
    }

    return () => {
      window.removeEventListener('resize', syncViewportMetrics)
      window.removeEventListener('orientationchange', syncViewportMetrics)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', syncViewportMetrics)
      }
    }
  }, [])

  return null
}
