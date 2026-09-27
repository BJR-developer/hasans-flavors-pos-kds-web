'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { StaffManagementTab } from '@/components/settings/StaffManagementTab';

function StaffPageContent() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/signin');
      } else if (user.role === 'cashier') {
        router.replace('/pos');
      } else if (user.role === 'customer') {
        router.replace('/signin');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'owner') return null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8F9FA] py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Staff</h1>
              <p className="text-xs text-neutral-500">
                Create cashier accounts, reset passwords, change usernames
              </p>
            </div>
          </div>
        </div>

        <StaffManagementTab />
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StaffPageContent />
    </Suspense>
  );
}
