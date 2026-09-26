'use client';

import React, { useState } from 'react';
import { Wallet, Edit3, History, ArrowRight, Check, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useActiveShift, useUpdateShiftOpeningCash } from '@/hooks/useShiftData';

interface SessionDrawerCardProps {
  cashierId?: string;
  isOwner?: boolean;
}

export function SessionDrawerCard({ cashierId, isOwner }: SessionDrawerCardProps) {
  const { user } = useAuthStore();
  const targetId = cashierId && cashierId !== 'all' ? cashierId : user?.id;
  const { data: activeShift, isLoading } = useActiveShift(targetId);
  const updateOpeningCashMutation = useUpdateShiftOpeningCash();

  const [isEditing, setIsEditing] = useState(false);
  const [newFloat, setNewFloat] = useState('');
  const [editReason, setEditReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (isLoading || !activeShift) return null;

  const openingCash = Number(activeShift.openingCash || 0);
  const auditEdits = activeShift.initialFloatEdits || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newFloat);
    if (isNaN(val) || val < 0) {
      setErrorMsg('Please enter a valid non-negative float amount.');
      return;
    }

    try {
      await updateOpeningCashMutation.mutateAsync({
        shiftId: activeShift.id,
        newOpeningCash: val,
        changedBy: user?.name || user?.email || (isOwner ? 'Owner' : 'Cashier'),
        reason: editReason.trim() || (isOwner ? 'Owner drawer correction' : 'Cashier drawer adjustment'),
      });
      setIsEditing(false);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update initial drawer float.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF2F0] border border-[#FECDD3] flex items-center justify-center text-[#BA1A20] shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900">Initial Drawer Float</h3>
            <p className="text-[11px] text-neutral-500">
              Opening cash counted at start of register session: <strong className="text-neutral-900">₱{openingCash.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setNewFloat(String(openingCash));
              setEditReason('');
              setErrorMsg('');
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-white text-xs font-semibold text-neutral-800 hover:border-neutral-900 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#BA1A20]" />
            <span>Edit Initial Drawer</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-4 rounded-xl border border-[#BA1A20]/30 bg-[#FFF2F0]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">Adjust Initial Drawer Amount</span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                New Float Amount (₱) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={newFloat}
                onChange={(e) => setNewFloat(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Reason for Change (Audit Tracking) *
              </label>
              <input
                type="text"
                required
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Corrected typo in starting cash"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
              />
            </div>
          </div>

          {errorMsg && <p className="text-[11px] text-[#BA1A20] font-medium">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateOpeningCashMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{updateOpeningCashMutation.isPending ? 'Saving...' : 'Save Initial Drawer'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Audit History Log */}
      {auditEdits.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
            <History className="w-3.5 h-3.5 text-neutral-500" />
            <span>Float Adjustment Audit Trail ({auditEdits.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {auditEdits.map((item: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                <div className="flex items-center justify-between font-bold text-neutral-900">
                  <span>
                    ₱{Number(item.previousAmount || 0).toLocaleString()}{' '}
                    <ArrowRight className="inline w-3 h-3 text-neutral-400" />{' '}
                    ₱{Number(item.newAmount || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    {item.changedAt ? new Date(item.changedAt).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 text-[11px] mt-1">
                  <span>Edited by: <strong>{item.changedBy || 'Staff'}</strong></span>
                  <span className="italic text-neutral-500">{item.reason || 'Float changed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
