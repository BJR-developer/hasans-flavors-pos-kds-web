'use client';

import React, { useState } from 'react';
import { Clock, Receipt, Banknote, PlusCircle } from 'lucide-react';
import { useActiveShift } from '@/hooks/useShiftData';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { StartShiftModal } from '../shifts/StartShiftModal';
import { ShiftHandoverModal } from '../shifts/ShiftHandoverModal';

export function PosShiftButton() {
  const { user } = useAuthStore();
  const { data: activeShift, refetch: refetchShift } = useActiveShift();
  const { data: orders = [] } = useOrders();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  return (
    <>
      {activeShift ? (
        <button
          type="button"
          onClick={() => setIsHandoverOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          title="Review Shift calculations and submit handover to owner"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Clock className="w-3.5 h-3.5 text-neutral-300" />
          <span>Shift: {activeShift.cashierName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-neutral-200">
            Handover
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsStartOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
          title="Open cashier shift and set opening float"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#BA1A20]" />
          <span>Start Shift</span>
        </button>
      )}

      {/* Start Shift Modal */}
      <StartShiftModal
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onStarted={() => refetchShift()}
      />

      {/* Shift Handover Modal */}
      {activeShift && (
        <ShiftHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          shift={activeShift}
          orders={orders}
          onClosed={() => refetchShift()}
        />
      )}
    </>
  );
}
