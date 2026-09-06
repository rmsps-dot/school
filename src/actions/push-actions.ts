'use server'

import { requireAuth } from '@/utils/auth-helpers'
import {
  savePushSubscription,
  removePushSubscription,
  VAPID_PUBLIC_KEY,
} from '@/utils/web-push'

export async function getVapidPublicKey(): Promise<{ publicKey: string }> {
  return { publicKey: VAPID_PUBLIC_KEY }
}

export async function subscribeUserToPush(
  subscriptionData: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  },
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if (!auth.ok) return { success: false, error: auth.error }

  if (!subscriptionData?.endpoint || !subscriptionData?.keys?.p256dh || !subscriptionData?.keys?.auth) {
    return { success: false, error: 'Invalid subscription object.' }
  }

  return await savePushSubscription(auth.profile.id, subscriptionData, userAgent)
}

export async function unsubscribeUserFromPush(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if (!auth.ok) return { success: false, error: auth.error }

  if (!endpoint) return { success: false, error: 'Endpoint required' }

  return await removePushSubscription(endpoint)
}
