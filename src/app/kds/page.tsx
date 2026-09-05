'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KdsBoard } from '@/components/kds/KdsBoard';
import { useAuthStore } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';

export default function KdsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  if (!isLoading && user?.role === 'owner') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-[#E5E5E5] rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF2F0] text-[#BA1A20] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1F1F1F]">Kitchen KDS Restricted</h2>
            <p className="text-xs text-[#737373] mt-1">
              You are signed in with the <strong>Owner</strong> role. Kitchen line operations are managed by the Cashier / Kitchen staff.
            </p>
          </div>
          <button
            onClick={() => router.push('/analytics')}
            className="w-full py-2 px-4 rounded-lg bg-[#BA1A20] text-white text-xs font-bold hover:bg-[#8B0000] transition-colors"
          >
            Go to Owner Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <KdsBoard />;
}
