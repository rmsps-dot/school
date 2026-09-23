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
    let isTerminalError = false

    const verifyRecoverySession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search)
          const hashString = window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash
          const hashParams = new URLSearchParams(hashString)

          // 1. Check for errors in search params or URL hash
          const errorDescription = searchParams.get('error_description') || hashParams.get('error_description')
          const errorCode = searchParams.get('error_code') || hashParams.get('error_code')
          const errorParam = searchParams.get('error') || hashParams.get('error')

          if (errorDescription || errorCode || errorParam) {
            isTerminalError = true
            const rawMsg = errorDescription || errorParam || ''
            const decoded = rawMsg ? decodeURIComponent(rawMsg.replace(/\+/g, ' ')) : ''
            const finalMsg = errorCode === 'otp_expired'
              ? 'This password reset link has expired or has already been used. Please request a new one.'
              : decoded || 'Invalid or expired reset link. Please request a new one.'

            if (mounted) {
              setError(finalMsg)
              setTargetEmail(null)
              setIsVerifying(false)
            }
            return
          }

          // 2. Token Hash flow (OTP recovery via token_hash)
          const tokenHash = searchParams.get('token_hash') || searchParams.get('token')
          const type = searchParams.get('type')
          if (tokenHash && type === 'recovery') {
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery',
            })
            if (verifyError) {
              isTerminalError = true
              if (mounted) {
                setError(verifyError.message || 'Invalid or expired reset link. Please request a new one.')
                setTargetEmail(null)
                setIsVerifying(false)
              }
              return
            }
            if (verifyData?.user?.email && mounted) {
              setTargetEmail(verifyData.user.email)
              setError('')
              setIsVerifying(false)
              return
            }
          }

          // 3. PKCE flow: code in search params
          const code = searchParams.get('code')
          if (code) {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              isTerminalError = true
              if (mounted) {
                const isPkceMismatch = exchangeError.message?.toLowerCase().includes('code verifier') ||
                                       exchangeError.message?.toLowerCase().includes('pkce')
                const friendlyMsg = isPkceMismatch
                  ? 'This password reset link was opened in a different browser or device session. Please request a new reset link to continue.'
                  : (exchangeError.message || 'Invalid or expired reset link. Please request a new one.')
                setError(friendlyMsg)
                setTargetEmail(null)
                setIsVerifying(false)
              }
              return
            }
            if (exchangeData?.user?.email && mounted) {
              setTargetEmail(exchangeData.user.email)
              setError('')
              setIsVerifying(false)
              return
            }
          }

          // 4. Implicit flow: check if hash explicitly specifies recovery type
          const hashType = hashParams.get('type')
          const accessToken = hashParams.get('access_token')
          if (accessToken && hashType === 'recovery') {
            // Supabase JS parses hash automatically and fires onAuthStateChange with PASSWORD_RECOVERY
            // Let the auth listener handle it
          } else if (!code) {
            // Neither PKCE code nor recovery hash present
            // Give a short grace period for Supabase hash parser, then verify if recovery occurred
            setTimeout(async () => {
              if (!mounted || isTerminalError) return
              // DO NOT blindly take ambient logged-in user session if there was no recovery
              if (!targetEmail) {
                setError('No active password reset request found. Please open the link sent to your email or request a new one.')
                setTargetEmail(null)
                setIsVerifying(false)
              }
            }, 1200)
            return
          }
        }
      } catch (err) {
        if (mounted) {
          isTerminalError = true
          setError(err instanceof Error ? err.message : 'Failed to verify reset session.')
          setTargetEmail(null)
          setIsVerifying(false)
        }
      }
    }

    verifyRecoverySession()

    // Listen STRICTLY for PASSWORD_RECOVERY auth event
    // Never allow ambient INITIAL_SESSION / SIGNED_IN of an existing user (e.g. Admin) to hijack targetEmail
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || isTerminalError) return

      if (event === 'PASSWORD_RECOVERY' && session?.user?.email) {
        setTargetEmail(session.user.email)
        setError('')
        setIsVerifying(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [targetEmail])

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
          {targetEmail && !success && !error && !isVerifying && (
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
