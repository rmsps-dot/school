'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-void text-white min-h-screen flex items-center justify-center p-4">
        <div className="glass max-w-lg w-full p-8 rounded-3xl flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border-2 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">System Crash</h1>
            <p className="text-mist text-sm">
              A critical error occurred at the root of the application.
            </p>
          </div>

          <div className="w-full bg-ink/50 border border-hairline p-4 rounded-xl text-left overflow-hidden">
            <p className="text-xs text-red-400 font-mono mb-1">Error Reason:</p>
            <p className="text-sm font-medium text-white break-words">
              {process.env.NODE_ENV === 'development'
                ? (error.message || 'Unknown fatal error')
                : 'Something went wrong. Please try again or contact support.'}
            </p>
            {error.digest && (
              <p className="text-xs text-mist mt-2 font-mono">Digest ID: {error.digest}</p>
            )}
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)]"
          >
            <RefreshCcw className="w-5 h-5" />
            Restart Application
          </button>
        </div>
      </body>
    </html>
  )
}
