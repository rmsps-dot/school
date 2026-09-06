'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, Check, AlertCircle } from 'lucide-react'
import { getVapidPublicKey, subscribeUserToPush, unsubscribeUserFromPush } from '@/actions/push-actions'

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

export function PushNotificationManager({
  compact = false,
}: {
  compact?: boolean
}) {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    } else {
      setIsSupported(false)
      setLoading(false)
    }
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(Boolean(sub))
      }
    } catch (err) {
      console.error('Error checking push subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleSubscription() {
    if (!isSupported) return
    setLoading(true)
    setStatusMessage(null)

    try {
      if (isSubscribed) {
        // Unsubscribe flow
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await unsubscribeUserFromPush(sub.endpoint)
            await sub.unsubscribe()
          }
        }
        setIsSubscribed(false)
        setStatusMessage('Push notifications turned off.')
      } else {
        // Subscribe flow
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setStatusMessage('Notification permission was not granted.')
          setLoading(false)
          return
        }

        const { publicKey } = await getVapidPublicKey()
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        // Clear any old orphaned subscription with mismatched keys
        const existingSub = await reg.pushManager.getSubscription()
        if (existingSub) {
          try {
            await existingSub.unsubscribe()
          } catch (cleanErr) {
            console.warn('Could not clean previous subscription:', cleanErr)
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

          setIsSubscribed(true)
          setStatusMessage('Push alerts activated successfully!')
        }
      }
    } catch (err: unknown) {
      console.error('Failed to change push subscription:', err)
      const errStr = String(err)
      if (errStr.includes('push service error') || errStr.includes('AbortError')) {
        setStatusMessage(
          'Push service unavailable. If using Brave or adblocker, enable "Use Google services for push messaging" in browser settings.'
        )
      } else {
        setStatusMessage('Failed to update push notification setting.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return null
  }

  if (compact) {
    return (
      <button
        onClick={handleToggleSubscription}
        disabled={loading}
        title={isSubscribed ? 'Push Notifications Active (Click to disable)' : 'Enable Push Notifications'}
        className={`p-2 rounded-xl transition-all border ${
          isSubscribed
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            : 'bg-ink/60 border-hairline text-mist hover:text-parchment'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-4 h-4 text-emerald-400" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </button>
    )
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
            isSubscribed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-ink/60 border-hairline text-mist'
          }`}
        >
          {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-parchment flex items-center gap-2">
            Device Push Notifications
            {isSubscribed && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> ACTIVE
              </span>
            )}
          </h4>
          <p className="text-xs text-mist mt-0.5">
            Receive instant attendance alerts, fee receipts, and school notices on this device.
          </p>
          {statusMessage && (
            <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${isSubscribed ? 'text-emerald-400' : 'text-coral'}`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {statusMessage}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleToggleSubscription}
        disabled={loading}
        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
          isSubscribed
            ? 'bg-mist/10 hover:bg-mist/20 text-parchment border border-hairline'
            : 'bg-coral hover:bg-coral/90 text-ink shadow-lg shadow-coral/20'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          'Disable on this Device'
        ) : (
          <>
            <Bell className="w-3.5 h-3.5" /> Enable Push Alerts
          </>
        )}
      </button>
    </div>
  )
}
