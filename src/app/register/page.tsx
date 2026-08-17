"use client";

import { useState, useEffect } from "react";
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
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border
          ${done
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            : active
            ? "border-coral/60 text-coral"
            : "border-hairline text-mist"
          }`}
        style={active ? { boxShadow: "0 0 16px rgba(241,145,125,0.3)" } : {}}
      >
        {done ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-xs font-medium tracking-wider uppercase hidden sm:block ${active ? "text-parchment" : "text-mist"}`}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className={`flex-1 h-px mx-2 mt-[-12px] sm:mt-[-18px] transition-all duration-500 ${active ? "bg-emerald-500/50" : "bg-white/10"}`} />
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
function OtpVerifyScreen({ email, onSuccess }: { email: string; onSuccess: () => void }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(60);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  async function handleVerify() {
    if (otp.trim().length < 6) { setError("Please enter the complete OTP."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: "signup" });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-coral/30"
          style={{ background: "rgba(241,145,125,0.1)", boxShadow: "0 0 32px rgba(241,145,125,0.15)" }}>
          <Mail className="w-8 h-8 text-coral" />
        </div>
        <h3 className="font-display text-xl font-bold text-parchment mb-1">Verify Your Email</h3>
        <p className="text-sm text-mist">
          We sent a 6-digit OTP to <span className="text-coral font-medium">{email}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="otp-input" className="text-xs font-semibold text-mist uppercase tracking-wider">
          Enter OTP <span className="text-coral">*</span>
        </label>
        <input
          id="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="— — — — — —"
          className="w-full px-4 py-4 input-glass rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-parchment placeholder-mist/30 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <button
        id="verify-otp-btn"
        onClick={handleVerify}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "var(--coral)", color: "var(--ink)" }}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <>Verify OTP <ArrowRight className="w-4 h-4" /></>}
      </button>

      <p className="text-xs text-mist text-center">
        Didn&apos;t receive it? Check your spam folder or{" "}
        {otpCooldown > 0 ? (
          <span className="text-mist">Resend in {otpCooldown}s</span>
        ) : (
          <button
            type="button"
            className="text-coral hover:underline transition-all"
            onClick={async () => { setOtpCooldown(60); await supabase.auth.resend({ type: "signup", email }); }}
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

    const { error: otpErr } = await supabase.auth.signUp({
      email: form.studentEmail.trim(),
      password: form.password,
      options: { data: { full_name: form.studentName.trim() } },
    });

    setLoading(false);
    if (otpErr) { setError(otpErr.message); return; }
    setOtpSent(true);
    setStep(3);
  }

  async function handleSubmitAfterVerify() {
    setLoading(true); setError("");
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
    setLoading(false);
    if (!result.success) { setError(result.error || "Submission failed."); return; }
    setSubmitted(true);
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
            <div className="flex items-center justify-center mb-10">
              {stepLabels.map((label, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <StepIndicator step={idx + 1} current={step} label={label} />
                  {idx < stepLabels.length - 1 && <StepConnector active={step > idx + 1} />}
                </div>
              ))}
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
                  onSuccess={async () => { await handleSubmitAfterVerify(); }}
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
