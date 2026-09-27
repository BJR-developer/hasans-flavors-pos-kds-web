'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import {
  User,
  SlidersHorizontal,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { AccountSettingsTab } from '@/components/settings/AccountSettingsTab';
import { PosSettingsTab } from '@/components/settings/PosSettingsTab';

type SettingsTab = 'account' | 'pos';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuthStore();

  const tabParam = searchParams.get('tab');

  // Redirect legacy ?tab=staff to /staff page
  useEffect(() => {
    if (tabParam === 'staff') {
      router.replace('/staff');
    }
  }, [tabParam, router]);

  const activeTab: SettingsTab = tabParam === 'pos' ? 'pos' : 'account';

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

  if (!user) return null;

  const handleTabChange = (tab: SettingsTab) => {
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8F9FA] py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={user?.role === 'owner' ? '/analytics' : '/pos'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{user?.role === 'owner' ? 'Back to Dashboard' : 'Back to POS Register'}</span>
              </Link>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Settings &amp; Preferences
            </h1>
            <p className="text-xs text-neutral-500">
              Manage your staff profile details and POS register financial configuration
            </p>
          </div>
        </div>

        {/* Layout: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-1 bg-white p-2 rounded-2xl border border-neutral-200 shadow-2xs">
            {/* Account Settings Tab Link */}
            <button
              type="button"
              onClick={() => handleTabChange('account')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                activeTab === 'account'
                  ? 'bg-neutral-900 text-white shadow-xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeTab === 'account'
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs block">Account Settings</span>
                  <span
                    className={`text-xs block ${
                      activeTab === 'account' ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    Profile, name &amp; email
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 ${
                  activeTab === 'account' ? 'text-white' : 'text-neutral-400'
                }`}
              />
            </button>

            {/* POS Settings Tab Link */}
            <button
              type="button"
              onClick={() => handleTabChange('pos')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                activeTab === 'pos'
                  ? 'bg-neutral-900 text-white shadow-xs font-bold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeTab === 'pos'
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs block">POS Settings</span>
                  <span
                    className={`text-xs block ${
                      activeTab === 'pos' ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    VAT &amp; payment methods
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 ${
                  activeTab === 'pos' ? 'text-white' : 'text-neutral-400'
                }`}
              />
            </button>
          </div>

          {/* Right Main Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'account' ? (
                <AccountSettingsTab key="account" />
              ) : (
                <PosSettingsTab key="pos" />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6 bg-canvas min-h-[calc(100vh-56px)]">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
