'use client';

import React from 'react';
import { Banknote, Smartphone, CreditCard, QrCode } from 'lucide-react';

export interface PaymentBreakdownData {
  cash: { amount: number; count: number };
  gcash: { amount: number; count: number };
  card: { amount: number; count: number };
  inr: { amount: number; count: number };
  online: { amount: number; count: number };
}

interface PaymentBreakdownCardProps {
  breakdown: PaymentBreakdownData;
  totalSales: number;
  totalOrders: number;
}

export function PaymentBreakdownCard({
  breakdown,
  totalSales,
  totalOrders,
}: PaymentBreakdownCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          Payment Methods Breakdown
        </h3>
        <span className="text-[11px] text-neutral-500">
          Total Sales: <strong>₱{totalSales.toLocaleString()}</strong> across{' '}
          <strong>
            {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cash */}
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash</span>
            </span>
            <span className="text-[10px] bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
              {breakdown.cash.count} {breakdown.cash.count === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-lg font-black text-emerald-900 mt-1">
            ₱{breakdown.cash.amount.toLocaleString()}
          </p>
        </div>

        {/* GCash */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>GCash</span>
            </span>
            <span className="text-[10px] bg-blue-100/90 text-blue-900 px-1.5 py-0.5 rounded font-bold">
              {breakdown.gcash.count} {breakdown.gcash.count === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-lg font-black text-blue-900 mt-1">
            ₱{breakdown.gcash.amount.toLocaleString()}
          </p>
        </div>

        {/* Card */}
        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70">
          <div className="flex items-center justify-between text-purple-800 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span>Card</span>
            </span>
            <span className="text-[10px] bg-purple-100/90 text-purple-900 px-1.5 py-0.5 rounded font-bold">
              {breakdown.card.count} {breakdown.card.count === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-lg font-black text-purple-900 mt-1">
            ₱{breakdown.card.amount.toLocaleString()}
          </p>
        </div>

        {/* INR / QR */}
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-600" />
              <span>INR / QR</span>
            </span>
            <span className="text-[10px] bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded font-bold">
              {breakdown.inr.count} {breakdown.inr.count === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-lg font-black text-amber-900 mt-1">
            ₱{breakdown.inr.amount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
