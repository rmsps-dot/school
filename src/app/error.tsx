'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Page Error Boundary Caught:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <div className="glass max-w-lg w-full p-8 rounded-3xl flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
          <p className="text-mist text-sm">
            We encountered an unexpected issue while loading this page.
          </p>
        </div>

        <div className="w-full bg-ink/50 border border-hairline p-4 rounded-xl text-left overflow-hidden">
          <p className="text-xs text-amber-400 font-mono mb-1">Error Reason:</p>
          <p className="text-sm font-medium text-white break-words">
            {process.env.NODE_ENV === 'development'
              ? (error.message || 'Unknown render error')
              : 'Something went wrong. Please try again or contact support.'}
          </p>
          {error.digest && (
            <p className="text-xs text-mist mt-2 font-mono">Digest ID: {error.digest}</p>
          )}
        </div>

        <button
          onClick={() => reset()}
          className="w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      </div>
    </div>
  )
}
