"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  KeyRound,
  Shield,
  Microscope,
  Globe,
  GraduationCap
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";

/* ─── Types ─── */
type Role = "admin" | "teacher" | "parent" | "student";

/* ─── Role → Dashboard route map ─── */
const ROLE_ROUTES: Record<Role, string> = {
  admin:   "/admin",
  teacher: "/teacher",
  parent:  "/parent",
  student: "/student",
};

/* ─── Small reusable input ─── */
function InputField({
  id,
  type,
  label,
  value,
  onChange,
  icon: Icon,
  disabled,
  autoComplete,
  rightSlot,
  roleTint,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  disabled?: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  roleTint: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-mist">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mist pointer-events-none" />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full pl-10 pr-10 py-3 rounded-xl bg-ink/50 border border-hairline text-parchment text-sm disabled:opacity-50 transition-all focus:outline-none ${
            roleTint === 'admin' ? 'focus:border-coral focus:ring-1 focus:ring-coral/50' :
            roleTint === 'teacher' ? 'focus:border-veena-blue focus:ring-1 focus:ring-veena-blue/50' :
            roleTint === 'parent' ? 'focus:border-gold focus:ring-1 focus:ring-gold/50' :
            'focus:border-role-student focus:ring-1 focus:ring-role-student/50'
          }`}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

/* ─── FORGOT PASSWORD MODAL ─── */
function ForgotPasswordModal({ onClose, roleTint }: { onClose: () => void, roleTint: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const tintColor = 
    roleTint === 'admin' ? 'text-coral bg-coral/10 border-coral/30' :
    roleTint === 'teacher' ? 'text-veena-blue bg-veena-blue/10 border-veena-blue/30' :
    roleTint === 'parent' ? 'text-gold bg-gold/10 border-gold/30' :
    'text-role-student bg-role-student/10 border-role-student/30';

  const btnBg = 
    roleTint === 'admin' ? 'bg-coral' :
    roleTint === 'teacher' ? 'bg-veena-blue' :
    roleTint === 'parent' ? 'bg-gold' :
    'bg-role-student';

  async function handleSend() {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-mist hover:text-parchment transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tintColor}`}>
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-display font-bold text-parchment mb-2">Reset Password</h3>
        
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-mist leading-relaxed">
              We've sent a password reset link to <strong className="text-parchment">{email}</strong>. Check your inbox.
            </p>
            <button onClick={onClose} className={`w-full py-2.5 rounded-xl font-semibold text-ink transition-all ${btnBg} hover:opacity-90`}>
              Got it
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-mist leading-relaxed">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <InputField
              id="reset-email"
              type="email"
              label="Email Address"
              value={email}
              onChange={setEmail}
              icon={Mail}
              disabled={loading}
              roleTint={roleTint}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-semibold text-ink transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${btnBg} hover:opacity-90`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Reset Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<Role>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPwd, setShowForgotPwd] = useState(false);

  // Read role from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role") as Role;
    if (roleParam && ["admin", "teacher", "parent", "student"].includes(roleParam)) {
      setSelectedRole(roleParam);
    }
  }, []);

  const roles: { id: Role; label: string; icon: React.ElementType }[] = [
    { id: "parent", label: "Parent", icon: Globe },
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "teacher", label: "Teacher", icon: Microscope },
    { id: "admin", label: "Admin", icon: Shield },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Login failed, no user returned.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) throw new Error("Could not verify user role.");

      if (profile.role === "pending") {
        await supabase.auth.signOut();
        setError("Your account is pending admin approval.");
        return;
      }

      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();
        setError(`You are registered as a ${profile.role}. Please select the correct tab.`);
        return;
      }

      router.push(ROLE_ROUTES[selectedRole]);
      
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
      setLoading(false);
    }
  };

  const currentRoleObj = roles.find(r => r.id === selectedRole)!;
  const RoleIcon = currentRoleObj.icon;

  const roleColors = {
    admin: 'var(--coral)',
    teacher: 'var(--veena-blue)',
    parent: 'var(--gold)',
    student: 'var(--role-student)',
  };

  const activeColor = roleColors[selectedRole];

  return (
    <div className="min-h-screen bg-ink flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      
      {/* ─── LEFT: Editorial Hero (Ink + Glow) ─── */}
      <div className="flex flex-col justify-center lg:justify-between p-8 lg:p-12 relative overflow-hidden lg:flex-1 min-h-[40vh] lg:min-h-screen border-b border-hairline lg:border-b-0 lg:border-r">
        {/* Masterplan Ambient Glow */}
        <div 
          className="absolute w-[150vw] h-[150vw] sm:w-[800px] sm:h-[800px] rounded-full blur-[80px] sm:blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)`,
            top: '-20%',
            left: '-20%'
          }}
        />
        
        <div className="relative z-10 flex flex-col items-start gap-6 lg:gap-0 lg:block">
          <Link 
            href="/" 
            className="inline-flex w-max items-center gap-2 px-4 py-2 mb-0 lg:mb-8 rounded-full bg-ink/50 backdrop-blur-md border border-hairline text-mist text-sm font-medium hover:text-parchment hover:border-mist/30 transition-all z-50 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to Homepage
          </Link>

          <Link href="/" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink shrink-0 border border-hairline flex items-center justify-center shadow-lg">
            <Image src="/icon-192.png" alt="RMSPS Logo" width={64} height={64} className="object-cover" />
            </div>
            <span className="font-display font-bold text-3xl sm:text-4xl tracking-widest text-parchment">
              RMSPS
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mt-8 lg:mt-0">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-parchment leading-[1.1] mb-4 lg:mb-6">
            Welcome back to RMSPS.
          </h1>
          <p className="text-mist text-base lg:text-lg font-body leading-relaxed">
            Sign in to access your personalized dashboard, manage records, and track academic progress.
          </p>
        </div>

        <div className="relative z-10 text-mist text-sm font-mono tracking-widest mt-8 lg:mt-0 hidden lg:block">
          SYSTEM V2.0 / {selectedRole.toUpperCase()} PORTAL
        </div>
      </div>

      {/* ─── RIGHT: Login Form (Parchment-tinted Glass) ─── */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile-only background elements */}
          <div 
            className="lg:hidden absolute w-[120vw] h-[120vw] max-w-[400px] max-h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 top-[-10%] right-[-10%]"
            style={{ background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)` }}
          />

          <div className="glass-panel p-8 sm:p-10 rounded-[2rem] w-full shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500"
                style={{ backgroundColor: `${activeColor}15`, color: activeColor }}
              >
                <RoleIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-parchment">{currentRoleObj.label} Portal</h2>
                <p className="text-mist text-sm">Please enter your credentials</p>
              </div>
            </div>

            {/* Role Tabs (Sliding Underline) */}
            <div className="flex bg-ink/50 p-1 rounded-xl mb-8 relative border border-hairline overflow-x-auto no-scrollbar">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.id);
                    setError(null);
                  }}
                  className={`flex-1 min-w-[80px] relative py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors z-10 ${
                    selectedRole === role.id ? "text-ink" : "text-mist hover:text-parchment"
                  }`}
                >
                  {role.label}
                  {selectedRole === role.id && (
                    <motion.div
                      layoutId="role-pill"
                      className="absolute inset-0 rounded-lg -z-10"
                      style={{ backgroundColor: activeColor }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400/90 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <InputField
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={setEmail}
                icon={Mail}
                disabled={loading}
                autoComplete="email"
                roleTint={selectedRole}
              />
              
              <InputField
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={setPassword}
                icon={Lock}
                disabled={loading}
                autoComplete="current-password"
                roleTint={selectedRole}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-mist hover:text-parchment transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPwd(true)}
                  className="text-xs font-medium text-mist hover:text-parchment transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-ink transition-all flex items-center justify-center gap-2 group disabled:opacity-50 hover:opacity-90 shadow-lg"
                style={{ backgroundColor: activeColor, boxShadow: `0 8px 30px ${activeColor}40` }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-mist">
                Don't have an account?{" "}
                <Link href="/register" className="font-bold text-parchment hover:underline decoration-1 underline-offset-4" style={{ textDecorationColor: activeColor }}>
                  Apply for Admission
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForgotPwd && <ForgotPasswordModal onClose={() => setShowForgotPwd(false)} roleTint={selectedRole} />}
    </div>
  );
}
