'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, AlertCircle, Loader2, Send, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { registerPushSubscription, isBraveBrowser } from '@/utils/push-client'
import { sendTestPushToCurrentUser } from '@/actions/push-actions'

interface TopBarPushNotificationProps {
  variant?: 'mobile' | 'desktop'
}

export function TopBarPushNotification({ variant = 'desktop' }: TopBarPushNotificationProps) {
  const [isSupported, setIsSupported] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function checkStatus() {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('Notification' in window)
      ) {
        setIsSupported(false)
        return
      }

      setPermission(Notification.permission)

      if (Notification.permission === 'granted' && 'PushManager' in window) {
        navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
          if (reg) {
            reg.pushManager.getSubscription().then((sub) => {
              setIsSubscribed(Boolean(sub))
            })
          }
        }).catch(() => {
          // ignore
        })
      } else {
        setIsSubscribed(false)
      }
    }

    checkStatus()

    const handleStatusChanged = () => {
      checkStatus()
    }
    window.addEventListener('rmsps_push_status_changed', handleStatusChanged)

    return () => {
      window.removeEventListener('rmsps_push_status_changed', handleStatusChanged)
    }
  }, [])

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  async function handleEnablePush() {
    setLoading(true)
    setErrorMsg(null)
    setTestResult(null)

    const res = await registerPushSubscription()
    setLoading(false)

    if (res.success) {
      setIsSubscribed(true)
      setPermission('granted')
      setMenuOpen(true)
    } else {
      setErrorMsg(res.error || 'Failed to enable notifications.')
      setMenuOpen(true)
    }
  }

  async function handleSendTest() {
    setTesting(true)
    setTestResult(null)
    setErrorMsg(null)

    const res = await sendTestPushToCurrentUser()
    setTesting(false)

    if (res.success) {
      setTestResult('Test push sent! Phone status bar / screen check karein.')
    } else {
      setErrorMsg(res.error || 'Failed to send test push.')
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* ── Mobile Trigger ── */}
      {variant === 'mobile' ? (
        <button
          type="button"
          onClick={() => {
            if (!isSubscribed) {
              handleEnablePush()
            } else {
              setMenuOpen(!menuOpen)
            }
          }}
          disabled={loading}
          className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
            isSubscribed
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20'
          }`}
          title={isSubscribed ? 'Notifications Active' : 'Enable Notifications'}
          aria-label="Push Notifications"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}

          {/* Indicator Dot */}
          {!isSubscribed ? (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-coral rounded-full animate-ping" />
          ) : (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </button>
      ) : (
        /* ── Desktop Trigger ── */
        <button
          type="button"
          onClick={() => {
            if (!isSubscribed) {
              handleEnablePush()
            } else {
              setMenuOpen(!menuOpen)
            }
          }}
          disabled={loading}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            isSubscribed
              ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
              : 'bg-coral hover:bg-coral/90 text-ink shadow-coral/10'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
          <span>{isSubscribed ? 'Alerts Active' : 'Enable Alerts'}</span>
          {!isSubscribed && (
            <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
          )}
        </button>
      )}

      {/* ── Popover Panel (Details / Test / Error Resolution) ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            className="absolute right-0 mt-2 w-80 sm:w-88 z-50 glass-panel rounded-2xl p-4 border border-hairline shadow-2xl bg-ink/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSubscribed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-coral/10 text-coral'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-parchment">
                  {isSubscribed ? 'Push Notifications' : 'Enable Device Alerts'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 text-mist hover:text-parchment rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Status */}
            {isSubscribed ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    Yeh device registered hai. Attendance alerts, fee receipts aur notices background me deliver honge.
                  </p>
                </div>

                {testResult && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 font-mono">
                    {testResult}
                  </p>
                )}

                {errorMsg && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={testing}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-ink bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending Test...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Test Notification
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Inactive / Error Guide Status */
              <div className="space-y-3">
                <p className="text-xs text-mist leading-relaxed">
                  Real-time alerts pane ke liye is device per notifications enable karein.
                </p>

                {errorMsg && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Alert Note
                    </p>
                    <p className="text-[11px] leading-relaxed text-mist">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      Allow & Enable Alerts
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
