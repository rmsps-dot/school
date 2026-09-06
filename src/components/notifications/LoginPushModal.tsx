'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { registerPushSubscription } from '@/utils/push-client'

export function LoginPushModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    // 1. If user already granted permission, never show popup!
    if (Notification.permission === 'granted') {
      return
    }

    // 2. If user already dismissed in this current session, don't nag immediately
    if (sessionStorage.getItem('rmsps_login_push_dismissed') === '1') {
      return
    }

    // 3. Gentle delay so page elements render first
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1200)

    const handleStatusChanged = () => {
      if (Notification.permission === 'granted') {
        setIsOpen(false)
      }
    }
    window.addEventListener('rmsps_push_status_changed', handleStatusChanged)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('rmsps_push_status_changed', handleStatusChanged)
    }
  }, [])

  async function handleAllow() {
    setLoading(true)
    setErrorText(null)

    const res = await registerPushSubscription()
    setLoading(false)

    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } else {
      setErrorText(res.error || 'Permission not granted.')
      // Auto dismiss after 4 seconds if error so user isn't stuck
      setTimeout(() => {
        setIsOpen(false)
        try {
          sessionStorage.setItem('rmsps_login_push_dismissed', '1')
        } catch {
          // ignore
        }
      }, 4500)
    }
  }

  function handleSkip() {
    setIsOpen(false)
    try {
      sessionStorage.setItem('rmsps_login_push_dismissed', '1')
    } catch {
      // Ignore
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* ── Compact Floating Toast Card (NO full-screen dark backdrop!) ── */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative glass-panel rounded-2xl p-4 sm:p-5 border border-coral/30 shadow-2xl bg-ink/95 backdrop-blur-xl overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20"
            style={{ background: 'var(--coral)' }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-3 top-3 p-1.5 text-mist hover:text-parchment rounded-lg transition-colors"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                success
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-coral/10 text-coral border border-coral/30'
              }`}
            >
              {success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
              ) : (
                <Bell className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div className="min-w-0 flex-1 pr-4">
              <h4 className="text-sm font-bold text-parchment font-display">
                {success ? 'Notifications Connected!' : 'Enable School Alerts?'}
              </h4>
              <p className="text-xs text-mist leading-relaxed mt-1">
                {success
                  ? 'Real-time attendance, fee receipts aur notices is device per aayenge.'
                  : 'Receive instant student attendance, fee receipts & school notices on this device.'}
              </p>
            </div>
          </div>

          {errorText && (
            <p className="text-[11px] text-amber-300 mt-3 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
              {errorText}
            </p>
          )}

          {!success && (
            <div className="flex items-center gap-2 mt-4 pt-1">
              <button
                type="button"
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 py-2 px-3.5 rounded-xl text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all shadow-md shadow-coral/10 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Allow Alerts
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="py-2 px-3 rounded-xl text-xs font-medium text-mist hover:text-parchment transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
