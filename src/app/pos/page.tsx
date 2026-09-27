'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PosRegister } from '@/components/pos/PosRegister';
import { useAuthStore } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';

export default function PosPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Role Gate: POS is strictly restricted to Cashier staff
  if (user.role === 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-line rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">Staff Operations Only</h2>
            <p className="text-xs text-muted mt-1">
              You are signed in with a Diner account. POS operations are restricted to Cashier staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Role Gate: If user is logged in as 'owner', POS is restricted per requirements
  if (user.role === 'owner') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-line rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">The register is for cashier accounts</h2>
            <p className="text-sm text-muted mt-1">
              Every sale must belong to a cashier&apos;s shift so the cash drawer adds up. To cover the till,
              sign in with a cashier account (create one in Staff).
            </p>
          </div>
          <button
            onClick={() => router.push('/analytics')}
            className="w-full py-2.5 px-4 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PosRegister />
    </Suspense>
  );
}
