'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
    }
    setIsLoading(false)
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
        <Link href="/login" className="inline-flex items-center gap-2 text-mist hover:text-parchment transition-colors mb-6 font-medium text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
        </Link>

        <div className="glass-panel rounded-3xl p-8 border border-hairline shadow-2xl">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-coral/30"
              style={{ background: 'rgba(241,145,125,0.1)' }}>
              <Mail className="w-6 h-6 text-coral" />
            </div>
            <h1 className="font-display text-3xl font-bold text-parchment mb-2">Reset Password</h1>
            <p className="text-mist text-sm">
              Enter your registered email and we&apos;ll send you a reset link.
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4"
              style={{ background: 'rgba(16,185,129,0.06)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-parchment mb-1">Check Your Email</h3>
                <p className="text-sm text-mist">
                  We&apos;ve sent a reset link to <span className="font-bold text-coral">{email}</span>.
                  Please check your inbox and spam folder.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-mist uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/60 pointer-events-none" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full input-glass rounded-xl py-3 pl-10 pr-4 text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isLoading || !email}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-ink transition-all hover:scale-[1.01]"
                style={{ background: 'var(--coral)' }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
