import webpush from 'web-push'
import { supabaseAdmin } from '@/utils/supabase/admin'

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BMxLA-Gj-tphlU3s8P-hlW_x8Uvvewp_Keilq7eFEzBnzP62dLKe0bXjCidrWEb6dNpL184kINt8FWR-7JBufj4'

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '98SS72TFANbksVXPVHgiFbmhllvvRpPRFPCO1pqKC8k'

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@rmsps.edu'

// Initialize VAPID details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} catch (err) {
  console.warn('Failed to configure web-push VAPID:', err)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

export interface StoredSubscription {
  id?: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at?: string
}

/**
 * Save or update a push subscription for a user.
 * Supports primary `push_subscriptions` table with automatic fallback to `settings` table store.
 */
export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent || null,
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })

    if (!error) return { success: true }

    // Fallback: If table doesn't exist yet, save to settings jsonb store
    const { data: settingRow } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle()

    const rawList = Array.isArray(settingRow?.value)
      ? (settingRow.value as unknown as StoredSubscription[])
      : []

    const filtered = rawList.filter((item) => item.endpoint !== sub.endpoint)
    filtered.push({
      ...payload,
      user_agent: userAgent || undefined,
      created_at: new Date().toISOString(),
    })

    await supabaseAdmin.from('settings').upsert(
      {
        key: 'push_subscriptions_store',
        value: filtered as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    return { success: true }
  } catch (err) {
    console.error('Error in savePushSubscription:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save subscription',
    }
  }
}

/**
 * Remove a push subscription by endpoint.
 */
export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint)

    // Also remove from fallback settings store if present
    const { data: settingRow } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle()

    if (Array.isArray(settingRow?.value)) {
      const rawList = settingRow.value as unknown as StoredSubscription[]
      const updated = rawList.filter((item) => item.endpoint !== endpoint)
      await supabaseAdmin.from('settings').upsert({
        key: 'push_subscriptions_store',
        value: updated as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete subscription',
    }
  }
}

/**
 * Fetch all active subscriptions for given user IDs.
 */
async function getSubscriptionsForUsers(
  userIds: string[]
): Promise<StoredSubscription[]> {
  if (!userIds || userIds.length === 0) return []

  try {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (!error && data && data.length > 0) {
      return data as StoredSubscription[]
    }
  } catch {
    // proceed to fallback
  }

  // Fallback to settings store
  try {
    const { data: settingRow } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle()

    if (Array.isArray(settingRow?.value)) {
      const rawList = settingRow.value as unknown as StoredSubscription[]
      return rawList.filter((item) => userIds.includes(item.user_id))
    }
  } catch (err) {
    console.error('Failed to query fallback push subscriptions:', err)
  }

  return []
}

/**
 * Send push notification to a specific list of user IDs.
 * Non-blocking and cleans up stale/expired subscriptions.
 */
export async function sendPushNotification(
  userIds: string[],
  payload: PushPayload
): Promise<{ success: boolean; sentCount: number }> {
  try {
    const subscriptions = await getSubscriptionsForUsers(userIds)
    if (subscriptions.length === 0) {
      return { success: true, sentCount: 0 }
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag,
    })

    let sentCount = 0

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payloadString
          )
          sentCount++
        } catch (pushErr: unknown) {
          const statusCode =
            pushErr && typeof pushErr === 'object' && 'statusCode' in pushErr
              ? (pushErr as { statusCode: number }).statusCode
              : null

          // Stale or expired subscription (410 Gone or 404 Not Found)
          if (statusCode === 410 || statusCode === 404) {
            await removePushSubscription(sub.endpoint)
          }
        }
      })
    )

    return { success: true, sentCount }
  } catch (err) {
    console.error('Error sending push notifications:', err)
    return { success: false, sentCount: 0 }
  }
}

/**
 * Broadcast push notification to an entire role ('parent' | 'teacher' | 'student' | 'admin' | 'all').
 */
export async function broadcastPushNotification(
  role: 'parent' | 'teacher' | 'student' | 'admin' | 'all',
  payload: PushPayload
): Promise<{ success: boolean; sentCount: number }> {
  try {
    let query = supabaseAdmin.from('profiles').select('id')
    if (role !== 'all') {
      query = query.eq('role', role)
    }

    const { data: profiles, error } = await query
    if (error || !profiles || profiles.length === 0) {
      return { success: true, sentCount: 0 }
    }

    const userIds = profiles.map((p) => p.id)
    return await sendPushNotification(userIds, payload)
  } catch (err) {
    console.error('Error broadcasting push notification:', err)
    return { success: false, sentCount: 0 }
  }
}
