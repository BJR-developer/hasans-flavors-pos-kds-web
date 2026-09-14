'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Payment Successful!</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Your payment has been received and verified. The kitchen has begun preparing your order.
        </p>

        {orderId && (
          <div className="bg-neutral-50 rounded-xl p-3.5 mb-6 border border-neutral-200 text-left">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Reference ID
            </span>
            <span className="text-sm font-mono font-bold text-neutral-900 select-all block break-all">
              {orderId}
            </span>
          </div>
        )}

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="text-sm font-bold text-emerald-900 mb-1">
            ✓ Done! You can now close this window
          </p>
          <p className="text-xs text-emerald-700">
            Please close this browser tab and return to the Hasan's Flavors app to track your order in real time.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Loading payment confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
