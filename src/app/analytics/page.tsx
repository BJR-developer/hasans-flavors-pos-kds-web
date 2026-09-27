'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { useAuthStore } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';
import { PageLoader } from '@/components/ui';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <PageLoader />;

  if (!user) {
    return null;
  }

  // Role Gate: Strictly Owner Only
  if (user.role !== 'owner') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-line rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF8E1] text-[#B45309] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">Owner only</h2>
            <p className="text-sm text-muted mt-1">
              You are signed in as <strong>{user.role === 'cashier' ? 'Cashier Staff' : 'Customer'}</strong>. Financial analytics, executive reports, and business KPIs are restricted to the <strong>Owner</strong> role.
            </p>
          </div>
          {user.role === 'cashier' && (
            <button
              onClick={() => router.push('/pos')}
              className="w-full py-2 px-4 rounded-lg bg-ink text-white text-xs font-bold hover:bg-black transition-colors"
            >
              Back to the register
            </button>
          )}
        </div>
      </div>
    );
  }

  return <AnalyticsOverview />;
}
