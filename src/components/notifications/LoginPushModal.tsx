'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Loader2, CheckCircle2 } from 'lucide-react'
import { getVapidPublicKey, subscribeUserToPush } from '@/actions/push-actions'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const clean = base64String.trim()
  const padding = '='.repeat((4 - (clean.length % 4)) % 4)
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function LoginPushModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client with service worker, Notification API, and PushManager support
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('Notification' in window) ||
      !('PushManager' in window)
    ) {
      return
    }

    // 1. If user already granted permission, ensure background registration and DO NOT show popup!
    if (Notification.permission === 'granted') {
      autoSyncSubscription()
      return
    }

    // 2. If user already dismissed in this current session tab, don't nag immediately
    if (sessionStorage.getItem('rmsps_login_push_dismissed') === '1') {
      return
    }

    // 3. If not granted, show permission prompt on login
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  async function autoSyncSubscription() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          const subJson = sub.toJSON()
          if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await subscribeUserToPush(
              {
                endpoint: subJson.endpoint,
                keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
              },
              navigator.userAgent
            )
          }
        }
      }
    } catch {
      // Silently handle
    }
  }

  async function handleAllow() {
    setLoading(true)
    setErrorText(null)

    try {
      // Trigger native browser permission prompt
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setErrorText('Notification permission was not allowed.')
        setLoading(false)
        return
      }

      // Register SW & VAPID subscription
      const { publicKey } = await getVapidPublicKey()
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Clean old subscription if key changed
      const oldSub = await reg.pushManager.getSubscription()
      if (oldSub) {
        try {
          await oldSub.unsubscribe()
        } catch {
          // Ignore
        }
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      const subJson = sub.toJSON()
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await subscribeUserToPush(
          {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
          navigator.userAgent
        )
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err: unknown) {
      console.warn('Push subscription failed:', err)
      // If browser push service failed (e.g. Brave/adblocker), close gracefully without crash
      setIsOpen(false)
    } finally {
      setLoading(false)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-md glass-panel rounded-3xl p-6 md:p-8 border border-hairline shadow-2xl bg-ink/95 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: 'var(--coral)' }}
          />

          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 p-2 text-mist hover:text-parchment rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center mb-5 text-coral">
            {success ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
            ) : (
              <Bell className="w-7 h-7 animate-pulse" />
            )}
          </div>

          <h3 className="text-xl font-display font-bold text-parchment mb-2">
            {success ? 'Notifications Enabled!' : 'Allow School Notifications?'}
          </h3>

          <p className="text-sm text-mist leading-relaxed mb-6">
            {success
              ? 'Your device is now connected. You will receive real-time updates directly on this screen.'
              : 'Turn on notifications to receive instant student attendance alerts, fee deposit receipts, report cards, and official notices.'}
          </p>

          {errorText && (
            <p className="text-xs text-red-400 mb-4 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              {errorText}
            </p>
          )}

          {!success && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleAllow}
                disabled={loading}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl text-sm font-bold text-ink bg-coral hover:bg-coral/90 transition-all shadow-lg shadow-coral/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Allow Notifications
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full sm:w-auto py-3 px-5 rounded-xl text-sm font-medium text-mist hover:text-parchment transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
