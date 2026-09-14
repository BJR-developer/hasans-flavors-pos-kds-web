'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Payment Cancelled</h1>
        <p className="text-sm text-neutral-600 mb-6">
          The payment transaction was not completed. You can try again or choose another payment method.
        </p>
        {orderId && (
          <div className="bg-neutral-50 rounded-xl p-3 mb-6 border border-neutral-200 text-xs text-neutral-600 font-mono">
            Order Reference: <span className="font-bold text-neutral-900">{orderId}</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/pos"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Register</span>
          </Link>
          <p className="text-xs text-neutral-400 mt-2">
            You may safely close this window.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Loading...</div>}>
      <CancelContent />
    </Suspense>
  );
}
