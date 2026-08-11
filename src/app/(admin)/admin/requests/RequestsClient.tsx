"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ApprovalModal from "@/components/admin/ApprovalModal";
import { useRouter } from "next/navigation";

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
  status: string;
}

interface ClassOption {
  id: string;
  class_name: string;
  section: string;
}

interface Props {
  initialRegistrations: Registration[];
  classes: ClassOption[];
  fetchError?: string;
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:  { label: "Pending",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30",   icon: Clock       },
    approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30",         icon: XCircle     },
  };
  const { label, color, icon: Icon } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/* ── MAIN CLIENT ── */
export default function RequestsClient({
  initialRegistrations,
  classes,
  fetchError,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);

  const filtered = initialRegistrations.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase()) ||
      (r.parent_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleDone(id: string, type: "approved" | "rejected") {
    setSelected(null);
    router.refresh();
  }

  return (
    <>
      {/* Approval modal */}
      <AnimatePresence>
        {selected && (
          <ApprovalModal
            registration={selected}
            classes={classes}
            onClose={() => setSelected(null)}
            onDone={(type) => handleDone(selected.id, type)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="surface-card rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
          <div>
            <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-coral" />
              Pending Requests
            </h1>
            <p className="text-mist mt-2 text-sm max-w-md">
              {filtered.length} application{filtered.length !== 1 ? "s" : ""} awaiting review for admission into the academy.
            </p>
          </div>
          <button
            id="refresh-requests-btn"
            onClick={() => router.refresh()}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-hairline rounded-xl text-sm font-semibold text-mist hover:text-coral hover:border-coral/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-3 surface-card rounded-2xl px-6 py-4 text-sm text-red-400 border border-red-500/20 font-mono">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {fetchError}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mist pointer-events-none" />
          <input
            id="requests-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email or parent email..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-ink border border-hairline text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 transition-all shadow-xl"
          />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !fetchError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-mist/50" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-parchment">No pending requests</p>
              <p className="text-mist text-sm max-w-sm mt-2 mx-auto">
                {search ? "No registrations match your search criteria." : "All admission applications have been completely reviewed."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Data table */}
        {filtered.length > 0 && (
          <div className="surface-card border border-hairline rounded-3xl overflow-hidden shadow-2xl">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 px-8 py-5 border-b border-hairline bg-surface text-xs font-bold text-mist uppercase tracking-widest">
              <span>Student</span>
              <span>Parent</span>
              <span>Contact</span>
              <span>Applied</span>
              <span>Action</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-hairline">
              {filtered.map((reg, i) => (
                <div
                  key={reg.id}
                  className="ledger-row px-8 py-6 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 sm:items-center hover:bg-surface/50 transition-colors group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Student */}
                  <div className="min-w-0">
                    <p className="text-base font-bold text-parchment truncate group-hover:text-coral transition-colors">{reg.student_name}</p>
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest truncate mt-1">{reg.student_email}</p>
                  </div>

                  {/* Parent */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-parchment truncate">
                      {reg.father_name ?? "—"} / {reg.mother_name ?? "—"}
                    </p>
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest truncate mt-1">{reg.parent_email ?? "—"}</p>
                  </div>

                  {/* Contact */}
                  <div className="min-w-0 font-mono text-xs">
                    <p className="text-mist">{reg.student_mobile ?? "—"}</p>
                    <p className="text-mist/70 mt-1">{reg.parent_mobile ?? "—"}</p>
                  </div>

                  {/* Date */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3">
                    <StatusBadge status={reg.status} />
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest">
                      {new Date(reg.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    id={`review-btn-${reg.id}`}
                    onClick={() => setSelected(reg)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-coral text-ink text-xs font-bold uppercase tracking-wider hover:bg-[#E67E6B] transition-colors whitespace-nowrap mt-2 sm:mt-0"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
