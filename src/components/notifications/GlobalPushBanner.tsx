'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Loader2, Check } from 'lucide-react'
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

export function GlobalPushBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    if (Notification.permission === 'denied') {
      return
    }

    if (sessionStorage.getItem('rmsps_push_banner_dismissed') === '1') {
      return
    }

    navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
      if (reg) {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) {
            setShowBanner(true)
          }
        })
      } else {
        setShowBanner(true)
      }
    }).catch(() => {
      // Ignore background registration errors
    })
  }, [])

  async function handleEnablePush() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setShowBanner(false)
        return
      }

      const { publicKey } = await getVapidPublicKey()
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Clean old subscription to prevent key mismatch
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
        setShowBanner(false)
      }, 2500)
    } catch (err) {
      console.warn('Could not complete push registration from banner:', err)
      setShowBanner(false)
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    try {
      sessionStorage.setItem('rmsps_push_banner_dismissed', '1')
    } catch {
      // Ignore
    }
  }

  if (!showBanner) return null

  return (
    <aside aria-label="Device push notifications prompt" className="mb-6 rounded-2xl bg-gradient-to-r from-ink via-ink/90 to-veena-blue/20 border border-gold/30 p-4 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center shrink-0">
            {success ? <Check className="w-5 h-5 text-emerald-400" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-parchment flex items-center gap-2">
              {success ? 'Push Alerts Activated!' : 'Turn on Web Push Notifications'}
            </h4>
            <p className="text-xs text-mist mt-0.5">
              {success
                ? 'Your device is now registered to receive real-time attendance, fee, and school alerts.'
                : 'Get instant notifications for attendance, fee receipts, and official school announcements.'}
            </p>
          </div>
        </div>

        {!success && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleEnablePush}
              disabled={loading}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-ink bg-gold hover:bg-gold/90 transition-all shadow-md shadow-gold/20 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enabling...
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" /> Enable Notifications
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              title="Dismiss for now"
              className="p-2 rounded-xl text-mist hover:text-parchment hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
