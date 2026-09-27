'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDeleteStaffUser } from '@/hooks/useStaffData';
import { StaffUser } from '@/types';

interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser;
  onSuccess?: () => void;
}

export function DeleteStaffModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: DeleteStaffModalProps) {
  const deleteMutation = useDeleteStaffUser();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setErrorMsg(null);
    try {
      const res = await deleteMutation.mutateAsync(staff.id);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1100);
      } else {
        setErrorMsg(res.message || 'Failed to delete staff account.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error deleting staff account.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-rose-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Delete Staff Account
                </h3>
                <p className="text-xs text-neutral-500">
                  Revoke credentials and remove staff access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                Staff Account Deleted
              </h4>
              <p className="text-xs text-neutral-500">
                {staff.fullName} ({staff.email}) has been removed.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-xs text-neutral-600 leading-relaxed">
                Are you sure you want to permanently delete the account for{' '}
                <strong className="text-neutral-900 font-bold">{staff.fullName}</strong>{' '}
                (<span className="font-mono text-neutral-800">{staff.email}</span>)?
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Audit Trail Preserved</span>
                </div>
                <p className="text-amber-800">
                  All past orders and shift handover calculations processed by this staff member will remain in historical reports for revenue records.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete Staff Account'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
