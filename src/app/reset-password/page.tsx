'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [targetEmail, setTargetEmail] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    const verifyRecoverySession = async () => {
      try {
        // 1. Check URL parameters for PKCE code or recovery hash
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          const errorParam = urlParams.get('error_description') || urlParams.get('error')

          if (errorParam) {
            if (mounted) {
              setError(decodeURIComponent(errorParam))
              setIsVerifying(false)
            }
            return
          }

          // If PKCE code exists in search params, exchange it for a fresh session
          if (code) {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              if (mounted) {
                setError(exchangeError.message || 'Invalid or expired reset link. Please request a new one.')
                setIsVerifying(false)
              }
              return
            }
            if (exchangeData?.user?.email && mounted) {
              setTargetEmail(exchangeData.user.email)
              setIsVerifying(false)
              return
            }
          }

          // Check hash for error (some Supabase setups pass errors in hash)
          const hash = window.location.hash
          if (hash && hash.includes('error_description=')) {
            const hashParams = new URLSearchParams(hash.substring(1))
            const hashError = hashParams.get('error_description')
            if (hashError && mounted) {
              setError(decodeURIComponent(hashError.replace(/\+/g, ' ')))
              setIsVerifying(false)
              return
            }
          }
        }

        // 2. Check current active recovery session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.email) {
          if (mounted) {
            setTargetEmail(session.user.email)
            setIsVerifying(false)
          }
        } else {
          // Give Supabase hash parser a moment (for implicit grant #access_token=)
          setTimeout(async () => {
            if (!mounted) return
            const { data: { session: delayedSession } } = await supabase.auth.getSession()
            if (delayedSession?.user?.email) {
              setTargetEmail(delayedSession.user.email)
            } else {
              setError('Invalid or expired reset link. Please request a new one.')
            }
            setIsVerifying(false)
          }, 1200)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to verify reset session.')
          setIsVerifying(false)
        }
      }
    }

    verifyRecoverySession()

    // Listen for auth state change (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (session?.user?.email) {
        setTargetEmail(session.user.email)
        setError('')
        setIsVerifying(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      const emailToSend = data?.user?.email || targetEmail

      // Send security alert email in background
      if (emailToSend) {
        fetch('/api/auth/notify-password-changed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToSend, name: data?.user?.user_metadata?.full_name }),
        }).catch((err) => console.warn('Security alert fetch failed:', err))
      }

      // Auto sign out to prevent session residue and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push(`/login${emailToSend ? `?email=${encodeURIComponent(emailToSend)}` : ''}`)
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while updating password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, var(--coral) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-8"
        style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-hairline shadow-2xl bg-[#0E0E14]/90 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-coral/30"
              style={{ background: 'rgba(241,145,125,0.1)' }}>
              <Lock className="w-6 h-6 text-coral" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-parchment mb-2">Create New Password</h1>
            <p className="text-mist text-xs sm:text-sm">Please set your new secure password below.</p>
          </div>

          {/* 1. Transparent Account Target Badge */}
          {targetEmail && !success && (
            <div className="mb-6 p-3 rounded-2xl bg-white/[0.03] border border-hairline flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-mist">Updating Password For</p>
                <p className="text-xs sm:text-sm font-bold text-parchment truncate font-mono">{targetEmail}</p>
              </div>
            </div>
          )}

          {/* Loading verification state */}
          {isVerifying && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-coral mx-auto" />
              <p className="text-xs text-mist font-medium">Verifying your security reset link...</p>
            </div>
          )}

          {/* Error Message */}
          {!isVerifying && error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs sm:text-sm flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <p className="leading-relaxed">{error}</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-coral hover:underline mt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Request a New Reset Link
              </Link>
            </motion.div>
          )}

          {/* Success Screen */}
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4"
              style={{ background: 'rgba(16,185,129,0.06)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-parchment mb-1">Password Updated!</h3>
                <p className="text-xs sm:text-sm text-mist leading-relaxed">
                  Your password has been changed successfully. Redirecting to login portal...
                </p>
              </div>
            </motion.div>
          ) : (
            !isVerifying && !error && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/60 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full rounded-xl py-3 pl-10 pr-11 text-parchment bg-[#101017] border border-white/15 placeholder-mist/40 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm font-sans"
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mist hover:text-parchment transition-colors p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/60 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full rounded-xl py-3 pl-10 pr-11 text-parchment bg-[#101017] border border-white/15 placeholder-mist/40 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm font-sans"
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mist hover:text-parchment transition-colors p-1"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-3 text-ink transition-all hover:scale-[1.01] shadow-lg shadow-coral/20"
                  style={{ background: 'var(--coral)' }}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            )
          )}
        </div>
      </motion.div>
    </div>
  )
}
