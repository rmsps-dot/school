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
      error: 'Web Push ke liye HTTPS connection ya localhost zaroori hai. Kripya secure domain se access karein.',
    }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      success: false,
      error: 'Aapke current browser me Web Push support nahi mila. Kripya Google Chrome ka upyog karein.',
    }
  }

  const perm = await requestCrossBrowserPermission()
  if (perm !== 'granted') {
    return {
      success: false,
      error: 'Notification permission allow nahi hui. Browser settings ya URL bar ke Lock 🔒 icon se allow karein.',
    }
  }

  try {
    const { publicKey } = await getVapidPublicKey()
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
          'Brave Browser me push enable karne ke liye URL bar me brave://settings/privacy kholein aur "Use Google services for push messaging" toggle ko ON karein.',
      }
    }
    return {
      success: false,
      error: errMsg || 'Push subscription register nahi ho saki. Kripya Google Chrome me try karein.',
    }
  }
}
