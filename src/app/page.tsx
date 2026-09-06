'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/signin');
      } else if (user.role === 'owner') {
        router.replace('/analytics');
      } else if (user.role === 'cashier') {
        router.replace('/pos');
      } else {
        router.replace('/signin');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#737373] font-medium">Loading operations portal...</p>
      </div>
    </div>
  );
}
