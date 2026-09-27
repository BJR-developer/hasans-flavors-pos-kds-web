'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Check, XCircle, Phone, Banknote } from 'lucide-react';
import { Order } from '@/types';

interface KdsCashReviewBannerProps {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function KdsCashReviewBanner({
  order,
  onAccept,
  onReject,
  isProcessing = false,
}: KdsCashReviewBannerProps) {
  const isDelivery = order.type === 'delivery';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-amber-50 border-b border-amber-300 p-3 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                {isDelivery ? 'Cash on Delivery Review' : 'Cash Order Review'}
              </span>
              <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                Pending Staff Approval
              </span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-tight mt-0.5">
              Customer placed via mobile app. Verify before kitchen starts cooking.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-xs font-black text-amber-950 justify-end">
            <Banknote className="w-3.5 h-3.5 text-amber-700" />
            <span>Collect ₱{Number(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 font-bold underline decoration-dotted mt-0.5"
            >
              <Phone className="w-2.5 h-2.5" />
              <span>{order.customerPhone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Accept & Reject Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Accept & Cook</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className="py-1.5 px-3 rounded-lg bg-white hover:bg-red-50 active:bg-red-100 border border-red-300 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      </div>
    </motion.div>
  );
}
