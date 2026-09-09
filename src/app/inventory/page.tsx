'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { CategoryManagementTab } from '@/components/inventory/CategoryManagementTab';
import { AddonManagementTab } from '@/components/inventory/AddonManagementTab';
import { useAuthStore } from '@/lib/auth';
import { ShieldAlert, Boxes, Layers, PlusCircle } from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dishes' | 'categories' | 'addons'>('dishes');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Role Gate: Customer diner accounts cannot access menu & stock management
  if (user.role === 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-[#E5E5E5] rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF2F0] text-[#BA1A20] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1F1F1F]">Staff Operations Only</h2>
            <p className="text-xs text-[#737373] mt-1">
              You are signed in with a Diner account. Menu and stock management is restricted to authorized staff members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFA] pb-16">
      {/* Top Sub-Navigation Bar */}
      <div className="bg-white border-b border-[#E5E5E5] sticky top-14 z-30 shadow-2xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]/80">
            <button
              type="button"
              onClick={() => setActiveTab('dishes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === 'dishes'
                  ? 'bg-white text-[#1F1F1F] shadow-2xs'
                  : 'text-[#737373] hover:text-[#1F1F1F]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Menu Dishes &amp; Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === 'categories'
                  ? 'bg-white text-[#1F1F1F] shadow-2xs'
                  : 'text-[#737373] hover:text-[#1F1F1F]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Management</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addons')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === 'addons'
                  ? 'bg-white text-[#1F1F1F] shadow-2xs'
                  : 'text-[#737373] hover:text-[#1F1F1F]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Sides &amp; Add-ons</span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-[#737373] hidden sm:block">
            {activeTab === 'dishes' ? (
              <span>Catalog pricing, availability, and bulk operations</span>
            ) : activeTab === 'categories' ? (
              <span>Manage menu sections, category cover photos, and dish assignments</span>
            ) : (
              <span>Manage optional sides, sauces, desserts, and add-on pricing</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dishes' ? (
        <InventoryTable />
      ) : activeTab === 'categories' ? (
        <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full">
          <CategoryManagementTab />
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full">
          <AddonManagementTab />
        </div>
      )}
    </div>
  );
}
