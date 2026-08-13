"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  BookOpen,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { approveRegistration, rejectRegistration, updatePendingRegistration } from "@/actions/admin-actions";

/* ── Types ── */
interface Registration {
  id: string;
  student_name: string;
  student_dob: string | null;
  student_email: string;
  student_mobile: string | null;
  address: string | null;
  father_name: string | null;
  mother_name: string | null;
  parent_mobile: string | null;
  parent_email: string | null;
  created_at: string;
}

interface ClassOption {
  id: string;
  class_name: string;
  section: string;
}

interface Props {
  registration: Registration;
  classes: ClassOption[];
  onClose: () => void;
  onDone: (type: "approved" | "rejected") => void;
}

/* ── Info Row ── */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-mist">{label}</p>
        <p className="text-sm text-parchment font-medium">{value}</p>
      </div>
    </div>
  );
}

/* ── Toast helper ── */
function Toast({
  msg,
  type,
}: {
  msg: string;
  type: "error" | "success";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-4
        ${type === "error"
          ? "bg-red-500/10 border border-red-500/30 text-red-400"
          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
        }`}
    >
      {type === "error" ? (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
      )}
      {msg}
    </motion.div>
  );
}

/* ── MAIN MODAL ── */
export default function ApprovalModal({ registration: reg, classes, onClose, onDone }: Props) {
  const [tab, setTab] = useState<"approve" | "reject">("approve");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    student_name: reg.student_name,
    student_dob: reg.student_dob || "",
    student_email: reg.student_email,
    student_mobile: reg.student_mobile || "",
    address: reg.address || "",
    father_name: reg.father_name || "",
    mother_name: reg.mother_name || "",
    parent_mobile: reg.parent_mobile || "",
    parent_email: reg.parent_email || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  function handleSaveEdits() {
    startTransition(async () => {
      const result = await updatePendingRegistration(reg.id, {
        student_name: formData.student_name,
        student_dob: formData.student_dob || null,
        student_email: formData.student_email,
        student_mobile: formData.student_mobile || null,
        address: formData.address || null,
        father_name: formData.father_name || null,
        mother_name: formData.mother_name || null,
        parent_mobile: formData.parent_mobile || null,
        parent_email: formData.parent_email,
      });

      if (result.success) {
        showToast("Registration updated.", "success");
        setIsEditing(false);
        // Also update local reg reference directly so UI stays updated if they toggle edit off
        reg.student_name = formData.student_name;
        reg.student_dob = formData.student_dob || null;
        reg.student_email = formData.student_email;
        reg.student_mobile = formData.student_mobile || null;
        reg.address = formData.address || null;
        reg.father_name = formData.father_name || null;
        reg.mother_name = formData.mother_name || null;
        reg.parent_mobile = formData.parent_mobile || null;
        reg.parent_email = formData.parent_email;
      } else {
        showToast(result.error ?? "Update failed.", "error");
      }
    });
  }

  function showToast(msg: string, type: "error" | "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleApprove() {
    if (!classId) { showToast("Please select a class first.", "error"); return; }
    startTransition(async () => {
      const result = await approveRegistration(reg.id, classId);
      if (result.success) {
        showToast("Student approved successfully!", "success");
        setTimeout(() => onDone("approved"), 1000);
      } else {
        showToast(result.error ?? "Approval failed.", "error");
      }
    });
  }

  function handleReject() {
    if (!rejectReason.trim()) { showToast("Please provide a rejection reason.", "error"); return; }
    startTransition(async () => {
      const result = await rejectRegistration(reg.id, rejectReason);
      if (result.success) {
        showToast("Registration rejected.", "success");
        setTimeout(() => onDone("rejected"), 1000);
      } else {
        showToast(result.error ?? "Rejection failed.", "error");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-ink/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="glass-panel border border-hairline rounded-2xl w-full max-w-xl relative my-4 flex flex-col max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-parchment">Review Application</h2>
            <p className="text-xs text-mist mt-0.5 font-mono">
              Applied {new Date(reg.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-mist border border-hairline hover:text-coral hover:border-coral/30 transition-all disabled:opacity-50"
              >
                Edit Data
              </button>
            ) : (
              <button
                onClick={handleSaveEdits}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Data
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-2 rounded-lg text-mist hover:text-parchment transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Toast */}
          <AnimatePresence>
            {toast && <Toast {...toast} />}
          </AnimatePresence>

          {/* Student details */}
          <div>
            <p className="text-xs font-bold text-mist uppercase tracking-widest mb-3">
              Student Information
            </p>
            <div className="surface-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Full Name</label><input name="student_name" value={formData.student_name} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Date of Birth</label><input type="date" name="student_dob" value={formData.student_dob} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Student Email</label><input type="email" name="student_email" value={formData.student_email} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Mobile</label><input name="student_mobile" value={formData.student_mobile} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1 sm:col-span-2"><label className="text-xs text-mist">Address</label><input name="address" value={formData.address} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                </>
              ) : (
                <>
                  <InfoRow icon={User}     label="Full Name"  value={reg.student_name} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={reg.student_dob ? new Date(reg.student_dob).toLocaleDateString("en-IN") : null} />
                  <InfoRow icon={Mail}     label="Student Email"  value={reg.student_email} />
                  <InfoRow icon={Phone}    label="Mobile"    value={reg.student_mobile} />
                  <InfoRow icon={MapPin}   label="Address"   value={reg.address} />
                </>
              )}
            </div>
          </div>

          {/* Parent details */}
          <div>
            <p className="text-xs font-bold text-mist uppercase tracking-widest mb-3">
              Parent / Guardian Information
            </p>
            <div className="surface-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Father's Name</label><input name="father_name" value={formData.father_name} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Mother's Name</label><input name="mother_name" value={formData.mother_name} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Parent Mobile</label><input name="parent_mobile" value={formData.parent_mobile} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                  <div className="flex flex-col gap-1"><label className="text-xs text-mist">Parent Email</label><input type="email" name="parent_email" value={formData.parent_email} onChange={handleChange} className="bg-ink/50 border border-hairline rounded px-2 py-1 text-sm text-parchment" /></div>
                </>
              ) : (
                <>
                  <InfoRow icon={Users} label="Father's Name"  value={reg.father_name} />
                  <InfoRow icon={Users} label="Mother's Name"  value={reg.mother_name} />
                  <InfoRow icon={Phone} label="Parent Mobile"  value={reg.parent_mobile} />
                  <InfoRow icon={Mail}  label="Parent Email"   value={reg.parent_email} />
                </>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 surface-card rounded-xl">
            <button
              id="tab-approve"
              onClick={() => setTab("approve")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
                ${tab === "approve" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-mist hover:text-parchment"}`}
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              id="tab-reject"
              onClick={() => setTab("reject")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
                ${tab === "reject" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-mist hover:text-parchment"}`}
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>

          {/* Approve panel */}
          <AnimatePresence mode="wait">
            {tab === "approve" ? (
              <motion.div
                key="approve-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="class-select" className="text-sm font-bold text-mist mb-1.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-coral" />
                    Assign Class <span className="text-coral">*</span>
                  </label>
                  {classes.length === 0 ? (
                    <div className="surface-card rounded-xl p-3 text-sm text-gold border border-gold/20">
                      ⚠ No classes exist yet. Create at least one class before approving.
                    </div>
                  ) : (
                    <select
                      id="class-select"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} — Section {c.section}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="surface-card rounded-xl p-3 text-xs text-mist space-y-1">
                  <p>✓ Student profile will be updated with submitted details</p>
                  <p>✓ Parent account will be created and an invite email sent</p>
                  <p>✓ Student & parent will be linked automatically</p>
                  <p>✓ Registration status will be marked as Approved</p>
                </div>

                <button
                  id="confirm-approve-btn"
                  onClick={handleApprove}
                  disabled={isPending || classes.length === 0}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Confirm Approval</>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="reject-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="reject-reason" className="text-sm font-bold text-mist mb-1.5 block">
                    Rejection Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Incomplete documents, age criteria not met..."
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
                  />
                </div>

                <button
                  id="confirm-reject-btn"
                  onClick={handleReject}
                  disabled={isPending}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Confirm Rejection</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
