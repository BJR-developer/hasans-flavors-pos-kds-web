'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useOrders } from '@/hooks/useRestaurantData';
import { PageLoader } from '@/components/ui';
import { OwnerCashAndShifts } from '@/components/shifts/OwnerCashAndShifts';
import { MyShiftView } from '@/components/shifts/MyShiftView';

export default function ShiftsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();

  useEffect(() => {
    if (!authLoading && (!user || user.role === 'customer')) router.replace('/signin');
  }, [user, authLoading, router]);

  if (authLoading || ordersLoading || !user) return <PageLoader />;
  if (user.role === 'owner') return <OwnerCashAndShifts orders={orders} />;
  if (user.role === 'cashier') return <MyShiftView orders={orders} />;
  return null;
}
