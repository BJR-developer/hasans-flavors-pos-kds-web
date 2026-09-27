'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { useAuthStore } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';

export default function OrdersPage() {
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

  // Role Gate: Customer diner accounts cannot access staff order management
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
              You are signed in with a Diner account. Staff order management is restricted to authorized staff members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <OrdersTable />;
}
