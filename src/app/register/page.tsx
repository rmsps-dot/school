"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  Home,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import DateInput from "@/components/shared/DateInput";
import { submitRegistration } from "@/actions/register-actions";

/* ─── Types ─── */
interface FormData {
  studentName: string;
  studentDob: string;
  studentEmail: string;
  studentMobile: string;
  studentAddress: string;
  fatherName: string;
  motherName: string;
  parentMobile: string;
  parentEmail: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormData = {
  studentName:     "",
  studentDob:      "",
  studentEmail:    "",
  studentMobile:   "",
  studentAddress:  "",
  fatherName:      "",
  motherName:      "",
  parentMobile:    "",
  parentEmail:     "",
  password:        "",
  confirmPassword: "",
};

/* ─── STEP INDICATOR ─── */
function StepIndicator({ step, current, label }: { step: number; current: number; label: string }) {
  const done   = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div
        className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 border
          ${done
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            : active
            ? "border-coral/70 bg-coral/10 text-coral ring-2 ring-coral/20"
            : "border-hairline bg-ink/40 text-mist"
          }`}
        style={active ? { boxShadow: "0 0 16px rgba(241,145,125,0.25)" } : {}}
      >
        {done ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
      </div>
      <span className={`text-[10px] sm:text-xs font-medium tracking-wider uppercase hidden sm:block ${active ? "text-parchment" : "text-mist"}`}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mx-2 -mt-4 sm:-mt-5 transition-all duration-300 ${active ? "bg-emerald-500/60" : "bg-white/10"}`} />
  );
}

/* ─── INPUT FIELD ─── */
function Field({
  id, label, type = "text", value, onChange, icon: Icon,
  required = true, placeholder, rightSlot,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; icon: React.ElementType;
  required?: boolean; placeholder?: string; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-mist uppercase tracking-wider">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mist/60 pointer-events-none" />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={id === "password" || id === "confirmPassword" ? "new-password" : undefined}
          className="w-full pl-10 pr-10 py-3 input-glass rounded-xl text-sm text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

/* ─── OTP VERIFY SCREEN ─── */
function OtpVerifyScreen({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: () => Promise<{ success: boolean; error?: string }>;
  onBack?: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(60);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        if (cleaned[i]) next[i] = cleaned[i];
      }
      setDigits(next);
      const nextFocus = Math.min(cleaned.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned[0];
    setDigits(next);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  async function handleVerify() {
    const fullOtp = digits.join("").trim();
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      setSuccessMsg("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: fullOtp,
      type: "signup",
    });

    if (err) {
      setLoading(false);
      setError(err.message || "Invalid or expired OTP. Please try again.");
      return;
    }

    // Give browser client a moment to flush cookies before server action is called
    await new Promise((r) => setTimeout(r, 800));

    // Call server action
    let res = await onSuccess();

    // If server action complains about session not found, retry once after short delay
    if (res && !res.success && res.error?.includes("Session not found")) {
      await new Promise((r) => setTimeout(r, 1000));
      res = await onSuccess();
    }

    setLoading(false);
    if (res && !res.success) {
      setError(res.error || "Verification failed");
    }
  }

  const isComplete = digits.join("").trim().length === 6;

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-6"
    >
      {/* Step heading */}
      <div>
        <p className="text-xs text-coral font-semibold tracking-widest uppercase mb-1">
          Step 3 of 3 — Email Verification
        </p>
        <h2 className="font-display text-2xl font-bold text-parchment">
          Verify Student Email
        </h2>
      </div>

      {/* Target Email badge with Edit option */}
      <div className="surface-card rounded-2xl p-4 flex items-center justify-between gap-3 border border-hairline">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-coral/30 shrink-0"
            style={{ background: "rgba(241,145,125,0.1)" }}
          >
            <Mail className="w-5 h-5 text-coral" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-mist uppercase tracking-wider">Verification OTP Sent To</p>
            <p className="text-xs sm:text-sm font-bold text-parchment truncate font-mono">{email}</p>
          </div>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-coral hover:underline shrink-0 px-2 py-1"
          >
            Change
          </button>
        )}
      </div>

      {/* 6-digit OTP Inputs */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-mist uppercase tracking-wider text-center">
          Enter 6-Digit Code <span className="text-coral">*</span>
        </label>
        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-sm mx-auto w-full">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-11 sm:w-12 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-ink/60 border transition-all focus:outline-none ${
                digit
                  ? "border-coral text-parchment shadow-[0_0_12px_rgba(241,145,125,0.2)]"
                  : "border-hairline text-mist focus:border-coral/60 focus:ring-1 focus:ring-coral/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error or Success notification */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && !error && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        {onBack && (
          <button
            type="button"
            disabled={loading}
            onClick={onBack}
            className="flex-1 py-3.5 rounded-xl surface-card font-semibold flex items-center justify-center gap-2 text-sm text-mist hover:text-parchment transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          id="verify-otp-btn"
          onClick={handleVerify}
          disabled={loading || !isComplete}
          className={`${onBack ? "flex-[2]" : "w-full"} py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]`}
          style={{ background: "var(--coral)", color: "var(--ink)" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              Verify OTP <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Resend OTP */}
      <p className="text-xs text-mist text-center">
        Didn&apos;t receive it? Check spam folder or{" "}
        {otpCooldown > 0 ? (
          <span className="text-mist font-medium">Resend in {otpCooldown}s</span>
        ) : (
          <button
            type="button"
            className="text-coral font-semibold hover:underline transition-all"
            onClick={async () => {
              setError("");
              setSuccessMsg("");
              setOtpCooldown(60);

              const { error: resendErr } = await supabase.auth.resend({
                type: "signup",
                email: email.trim().toLowerCase(),
              });
              if (resendErr) {
                const msg =
                  !resendErr.message || resendErr.message === "{}"
                    ? "Failed to resend verification email. Please try again later."
                    : resendErr.message;
                setError(msg);
                setOtpCooldown(0);
              } else {
                setSuccessMsg("OTP resent successfully!");
              }
            }}
          >
            resend OTP
          </button>
        )}
      </p>
    </motion.div>
  );
}

/* ─── MAIN REGISTER PAGE ─── */
export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MOBILE_RE = /^[6-9]\d{9}$/;

  function validateStep1() {
    if (!form.studentName.trim()) return "Student name is required.";
    if (!form.studentDob) return "Date of birth is required.";
    if (!form.studentEmail.trim()) return "Student email is required.";
    if (!EMAIL_RE.test(form.studentEmail.trim())) return "Enter a valid student email address.";
    const mob = form.studentMobile.replace(/\D/g, "");
    if (!mob || mob.length !== 10 || !MOBILE_RE.test(mob)) return "Enter a valid 10-digit Indian mobile number.";
    if (!form.studentAddress.trim()) return "Address is required.";
    if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return "";
  }

  function validateStep2() {
    if (!form.fatherName.trim()) return "Father&apos;s name is required.";
    if (!form.motherName.trim()) return "Mother&apos;s name is required.";
    const pMob = form.parentMobile.replace(/\D/g, "");
    if (!pMob || pMob.length !== 10 || !MOBILE_RE.test(pMob)) return "Enter a valid 10-digit parent mobile number.";
    if (!form.parentEmail.trim()) return "Parent email is required.";
    if (!EMAIL_RE.test(form.parentEmail.trim())) return "Enter a valid parent email address.";
    if (form.studentEmail.trim().toLowerCase() === form.parentEmail.trim().toLowerCase()) {
      return "⚠️ Student email and parent email cannot be the same. Please use different email addresses.";
    }
    return "";
  }

  async function handleStep1Next() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(""); setStep(2);
  }

  async function handleSendOTP() {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);
    // Clear any stale local auth session before initiating signup
    await supabase.auth.signOut();

    const { error: otpErr } = await supabase.auth.signUp({
      email: form.studentEmail.trim(),
      password: form.password,
      options: { data: { full_name: form.studentName.trim() } },
    });

    setLoading(false);
    if (otpErr) {
      const msg = (!otpErr.message || otpErr.message === '{}')
        ? 'Failed to send verification email. The email service might be temporarily unavailable. Please try again or contact administration.'
        : otpErr.message;
      setError(msg);
      return;
    }
    setOtpSent(true);
    setStep(3);
  }

  async function handleSubmitAfterVerify() {
    const result = await submitRegistration({
      studentName:    form.studentName.trim(),
      studentDob:     form.studentDob,
      studentEmail:   form.studentEmail.trim(),
      studentMobile:  form.studentMobile.trim(),
      studentAddress: form.studentAddress.trim(),
      fatherName:     form.fatherName.trim(),
      motherName:     form.motherName.trim(),
      parentMobile:   form.parentMobile.trim(),
      parentEmail:    form.parentEmail.trim(),
    });
    if (!result.success) { return { success: false, error: result.error || "Submission failed." }; }
    setSubmitted(true);
    return { success: true };
  }

  const stepLabels = ["Student Info", "Parent Info", "Verify Email"];

  return (
    <div className="min-h-screen bg-ink flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
          style={{ background: "radial-gradient(circle, #F1917D 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-8"
          style={{ background: "radial-gradient(circle, #D4AF6A 0%, transparent 70%)" }} />
      </div>

      {/* ─── LEFT PANEL ─── */}
      <div className="flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden lg:w-[420px] lg:min-h-screen border-b border-hairline lg:border-b-0 lg:border-r min-h-[180px] lg:min-h-auto">
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex w-max items-center gap-2 px-4 py-2 mb-8 rounded-full border border-hairline text-mist text-sm font-medium hover:text-parchment hover:border-mist/30 transition-all group"
            style={{ background: "rgba(11,11,16,0.5)", backdropFilter: "blur(12px)" }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Homepage
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-ink shrink-0 border border-hairline flex items-center justify-center shadow-lg">
              <Image src="/icon-192.png" alt="RMSPS Logo" width={64} height={64} className="object-cover" />
            </div>
            <span className="font-display font-bold text-4xl tracking-widest text-parchment">RMSPS</span>
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-parchment leading-tight mb-4">
            Admission<br />Application
          </h1>
          <p className="text-mist text-sm leading-relaxed max-w-xs">
            Apply for admission to Residential Maa Saraswati Public School. Fill in the details to begin your journey.
          </p>
        </div>

        <div className="relative z-10 text-mist text-xs font-mono tracking-widest mt-8 lg:mt-0 hidden lg:block">
          RMSPS · ADMISSIONS PORTAL · {new Date().getFullYear()}
        </div>
      </div>

      {/* ─── RIGHT: FORM ─── */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-[520px]">

          {/* Step Indicators */}
          {!submitted && (
            <div className="flex items-center justify-between max-w-sm mx-auto mb-8 sm:mb-10 w-full px-2">
              {stepLabels.map((label, idx) => {
                const s = idx + 1;
                const isLast = idx === stepLabels.length - 1;
                return (
                  <div key={idx} className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}>
                    <StepIndicator step={s} current={step} label={label} />
                    {!isLast && <StepConnector active={step > s} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Card */}
          <div className="glass-panel rounded-3xl p-8">
            <AnimatePresence mode="wait">
              {/* ── SUCCESS ── */}
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-6 py-4"
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-emerald-500/40"
                    style={{ background: "rgba(16,185,129,0.12)", boxShadow: "0 0 48px rgba(16,185,129,0.15)" }}>
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-parchment mb-2">Application Submitted!</h2>
                    <p className="text-mist text-sm leading-relaxed max-w-sm">
                      Your admission application for{" "}
                      <span className="text-coral font-medium">{form.studentName}</span> has been received and is under review.
                      The admin team will contact you at{" "}
                      <span className="text-coral">{form.parentEmail}</span> with the next steps.
                    </p>
                  </div>
                  <div className="surface-card rounded-2xl p-4 w-full text-left text-sm text-mist space-y-2">
                    <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Email verification complete</p>
                    <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Application saved for admin review</p>
                    <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Confirmation email sent</p>
                  </div>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-ink transition-all hover:scale-[1.02]"
                    style={{ background: "var(--coral)" }}
                  >
                    <Home className="w-4 h-4" /> Back to Home
                  </Link>
                </motion.div>
              ) : step === 3 && otpSent ? (
                <OtpVerifyScreen
                  email={form.studentEmail.trim()}
                  onSuccess={handleSubmitAfterVerify}
                  onBack={() => {
                    setError("");
                    setStep(1);
                    setOtpSent(false);
                  }}
                />
              ) : (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {/* Step heading */}
                  <div>
                    <p className="text-xs text-coral font-semibold tracking-widest uppercase mb-1">
                      Step {step} of 3 — {stepLabels[step - 1]}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-parchment">
                      {step === 1 ? "Student Information" : "Parent / Guardian Details"}
                    </h2>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                    </div>
                  )}

                  {/* ── STEP 1 ── */}
                  {step === 1 && (
                    <>
                      <Field id="studentName" label="Student Full Name" value={form.studentName} onChange={set("studentName")} icon={User} placeholder="e.g. Rahul Kumar Sharma" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateInput id="studentDob" label="Date of Birth" value={form.studentDob} onChange={set("studentDob")} required />
                        <Field id="studentMobile" label="Student Mobile" value={form.studentMobile} onChange={set("studentMobile")} icon={Phone} placeholder="10-digit number" />
                      </div>
                      <Field id="studentEmail" label="Student Email" value={form.studentEmail} onChange={set("studentEmail")} icon={Mail} type="email" placeholder="student@example.com" />
                      <Field id="studentAddress" label="Home Address" value={form.studentAddress} onChange={set("studentAddress")} icon={MapPin} placeholder="Village / Town, District, State" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          id="password" label="Create Password" type={showPassword ? "text" : "password"}
                          value={form.password} onChange={set("password")} icon={Lock} placeholder="Min. 8 characters"
                          rightSlot={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-mist hover:text-parchment transition-colors">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                        <Field
                          id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword} onChange={set("confirmPassword")} icon={Lock} placeholder="Re-enter password"
                          rightSlot={
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-mist hover:text-parchment transition-colors">
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                      </div>
                      <button
                        id="step1-next-btn"
                        type="button"
                        onClick={handleStep1Next}
                        className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.01] active:scale-[0.99] mt-1"
                        style={{ background: "var(--coral)", color: "var(--ink)" }}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* ── STEP 2 ── */}
                  {step === 2 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field id="fatherName" label="Father's Name" value={form.fatherName} onChange={set("fatherName")} icon={Users} placeholder="e.g. Ramesh Kumar" />
                        <Field id="motherName" label="Mother's Name" value={form.motherName} onChange={set("motherName")} icon={Users} placeholder="e.g. Sunita Devi" />
                      </div>
                      <Field id="parentMobile" label="Parent's Mobile" value={form.parentMobile} onChange={set("parentMobile")} icon={Phone} placeholder="10-digit number" />

                      <div className="flex flex-col gap-1.5">
                        <Field id="parentEmail" label="Parent's Email" value={form.parentEmail} onChange={set("parentEmail")} icon={Mail} type="email" placeholder="parent@example.com" required />
                        {form.parentEmail.trim() && form.parentEmail.trim().toLowerCase() === form.studentEmail.trim().toLowerCase() && (
                          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            Parent email cannot be the same as student email.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => { setError(""); setStep(1); }}
                          className="flex-1 py-3.5 rounded-xl surface-card font-semibold flex items-center justify-center gap-2 text-sm text-mist hover:text-parchment transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                          id="step2-send-otp-btn"
                          type="button"
                          onClick={handleSendOTP}
                          disabled={loading}
                          className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-60 transition-all hover:scale-[1.01]"
                          style={{ background: "var(--coral)", color: "var(--ink)" }}
                        >
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Login link */}
          {!submitted && (
            <p className="text-center mt-6 text-sm text-mist">
              Already have an account?{" "}
              <Link href="/login" className="text-coral font-semibold hover:underline transition-all">
                Login here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
