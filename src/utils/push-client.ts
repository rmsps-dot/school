'use client'

import { getVapidPublicKey, subscribeUserToPush } from '@/actions/push-actions'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

export async function requestCrossBrowserPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  try {
    const res = await Notification.requestPermission()
    if (res) return res
  } catch {
    // Older callback syntax fallback
    return new Promise<NotificationPermission>((resolve) => {
      Notification.requestPermission((status) => resolve(status))
    })
  }
  return Notification.permission
}

export async function isBraveBrowser(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const nav = navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }
  if (nav.brave?.isBrave) {
    try {
      return await nav.brave.isBrave()
    } catch {
      return false
    }
  }
  return false
}

export async function registerPushSubscription(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Window not defined' }

  // Check secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    return {
      success: false,
      error: 'Web Push requires an HTTPS connection or localhost. Please access via a secure domain.',
    }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      success: false,
      error: 'Web Push is not supported in your current browser. Please use Google Chrome.',
    }
  }

  const perm = await requestCrossBrowserPermission()
  if (perm !== 'granted') {
    return {
      success: false,
      error: 'Notification permission was denied. Please allow it from your browser settings or the Lock 🔒 icon in the URL bar.',
    }
  }

  try {
    const { publicKey } = await getVapidPublicKey()
    if (!publicKey || publicKey.trim().length === 0) {
      return {
        success: false,
        error:
          'Push notification keys missing hain. Vercel Dashboard me NEXT_PUBLIC_VAPID_PUBLIC_KEY aur VAPID_PRIVATE_KEY environment variables add karke redeploy karein.',
      }
    }

    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    // Clean old/mismatched subscription
    try {
      const oldSub = await reg.pushManager.getSubscription()
      if (oldSub) {
        await oldSub.unsubscribe()
      }
    } catch {
      // ignore
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey)
    if (applicationServerKey.length === 0) {
      return {
        success: false,
        error: 'Invalid VAPID key format. Please check NEXT_PUBLIC_VAPID_PUBLIC_KEY.',
      }
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    })

    const subJson = sub.toJSON()
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { success: false, error: 'Browser ne incomplete push keys return kiye.' }
    }

    const saveRes = await subscribeUserToPush(
      {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      },
      navigator.userAgent
    )

    if (saveRes.success) {
      window.dispatchEvent(new Event('rmsps_push_status_changed'))
    }
    return saveRes
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const brave = await isBraveBrowser()
    if (brave || errMsg.includes('push service error') || errMsg.includes('AbortError')) {
      return {
        success: false,
        error:
          'To enable push notifications in Brave Browser, open brave://settings/privacy and toggle "Use Google services for push messaging" to ON.',
      }
    }
    return {
      success: false,
      error: errMsg || 'Failed to register push subscription. Please try again in Google Chrome.',
    }
  }
}
