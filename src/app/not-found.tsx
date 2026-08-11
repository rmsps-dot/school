import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-parchment p-6">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-[2rem] bg-coral/10 border border-coral/20 flex items-center justify-center shadow-2xl shadow-coral/5 pulse-glow">
          <AlertCircle className="w-12 h-12 text-coral" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter">404</h1>
          <h2 className="text-xl md:text-2xl font-bold text-mist">Page Not Found</h2>
        </div>

        <p className="text-mist text-sm leading-relaxed max-w-xs">
          The page you are looking for has either moved, been deleted, or never existed in the RMSPS portal.
        </p>

        <Link
          href="/"
          className="mt-8 btn-primary px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>
      
      <div className="absolute bottom-12 text-xs font-mono text-mist/50 tracking-widest">
        SYSTEM V2.0 // ERROR
      </div>
    </div>
  );
}
