'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { updateParentProfile } from '@/actions/user-management-actions';

interface ParentData {
  id: string; // The profile_id
  full_name: string | null;
  mobile: string | null;
  address: string | null;
  dob: string | null;
}

interface ParentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: ParentData;
  onSuccess: () => void;
}

export default function ParentEditModal({ isOpen, onClose, parent, onSuccess }: ParentEditModalProps) {
  const [formData, setFormData] = useState({
    full_name: parent.full_name || '',
    mobile: parent.mobile || '',
    address: parent.address || '',
    dob: parent.dob || ''
  });
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const res = await updateParentProfile(parent.id, formData);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
        onClose();
      }
    });
  };

  const inputClass = "w-full input-glass rounded-xl px-4 py-3 text-parchment focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm";
  const labelClass = "block text-xs font-bold text-mist uppercase tracking-wider mb-1.5";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="surface-card w-full max-w-lg rounded-3xl border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-hairline flex items-center justify-between bg-ink/50 sticky top-0 z-10">
            <div>
              <h2 className="font-display text-xl font-bold text-parchment">Edit Parent Profile</h2>
              <p className="text-sm text-mist mt-1">Update personal information</p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-2 rounded-xl text-mist hover:text-parchment hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form id="parent-edit-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                  placeholder="Enter full address"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-hairline bg-ink/50 flex justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-mist hover:text-parchment hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="parent-edit-form"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-ink bg-coral hover:bg-coral/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
