'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession()
          if (!delayedSession) {
            setError('Invalid or expired reset link. Please request a new one.')
          }
        }, 1000)
      }
    }
    checkSession()
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

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        supabase.auth.signOut().then(() => { router.push('/login') })
      }, 3000)
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
        <div className="glass-panel rounded-3xl p-8 border border-hairline shadow-2xl">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-coral/30"
              style={{ background: 'rgba(241,145,125,0.1)' }}>
              <Lock className="w-6 h-6 text-coral" />
            </div>
            <h1 className="font-display text-3xl font-bold text-parchment mb-2">Create New Password</h1>
            <p className="text-mist text-sm">Please enter your new password below.</p>
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
                <h3 className="font-display font-bold text-lg text-parchment mb-1">Password Updated!</h3>
                <p className="text-sm text-mist">Your password has been changed successfully. Redirecting to login...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'New Password', value: password, onChange: setPassword, placeholder: '••••••••' },
                { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, placeholder: '••••••••' },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">{field.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/60 pointer-events-none" />
                    <input
                      type="password" required
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full input-glass rounded-xl py-3 pl-10 pr-4 text-parchment placeholder-mist/30 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm"
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={isLoading || error.includes('expired')}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-ink transition-all hover:scale-[1.01]"
                style={{ background: 'var(--coral)' }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
