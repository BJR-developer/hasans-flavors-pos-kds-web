'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Play,
  LogOut,
  Receipt,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useOrders } from '@/hooks/useRestaurantData';
import { useActiveShift, useStartShift } from '@/hooks/useShiftData';
import { calculateShiftMetrics } from '@/lib/shiftApi';
import { StartShiftModal } from './StartShiftModal';
import { ShiftHandoverModal } from './ShiftHandoverModal';

export function CashierShiftView() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { data: orders = [] } = useOrders();
  const { data: activeShift, isLoading, refetch } = useActiveShift(user?.id);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer for active shift
  useEffect(() => {
    if (!activeShift?.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const startTs = new Date(activeShift.startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTs) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeShift?.startTime]);

  const formatElapsed = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Calculate live shift metrics based on orders placed during this session
  const shiftMetrics = useMemo(() => {
    if (!activeShift) {
      return {
        totalOrders: 0,
        totalItemsSold: 0,
        grossSales: 0,
        cashSales: 0,
        cardSales: 0,
        onlineSales: 0,
        expectedCash: 0,
      };
    }

    return calculateShiftMetrics({
      startTime: activeShift.startTime,
      cashierId: activeShift.cashierId || user?.id,
      cashierName: activeShift.cashierName || user?.name,
      openingCash: activeShift.openingCash || 0,
      orders,
    });
  }, [activeShift, user, orders]);

  const handleLogoutAfterClose = async () => {
    await signOut();
    router.replace('/signin');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shift Status Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Staff Shift Status
              </span>
              {activeShift ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Shift Running
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
                  No Active Shift
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-neutral-900">
              {user?.name || 'Cashier Staff'}
              {user?.email && <span className="text-xs text-neutral-400 font-normal ml-2">({user.email})</span>}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {!activeShift ? (
              <button
                type="button"
                onClick={() => setIsStartModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BA1A20] hover:bg-[#9E1419] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Start Shift Session</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEndModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>End Shift &amp; Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Shift Details & Live Metrics */}
      {activeShift ? (
        <div className="space-y-6">
          {/* Live Timer Banner */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                  Active Working Duration
                </span>
                <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-amber-400">
                  {formatElapsed(elapsedSeconds)}
                </p>
                <p className="text-xs text-neutral-300">
                  Started at{' '}
                  <strong className="text-white">
                    {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                  {' '}on {new Date(activeShift.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-neutral-700 sm:pl-6">
                <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider block">
                  Starting Float
                </span>
                <span className="text-2xl font-black text-white font-mono block">
                  ₱{Number(activeShift.openingCash || 0).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-400">Cash drawer initial amount</span>
              </div>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders Processed */}
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Orders Handled</span>
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">
                {shiftMetrics.totalOrders}
              </h3>
              <p className="text-[11px] text-neutral-500">Completed POS tickets</p>
            </div>

            {/* Total Products / Dishes Sold */}
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Products Sold</span>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">
                {shiftMetrics.totalItemsSold}
              </h3>
              <p className="text-[11px] text-neutral-500">Total dish plates served</p>
            </div>

            {/* Gross Revenue Generated */}
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Total Sales</span>
                <DollarSign className="w-4 h-4 text-[#BA1A20]" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">
                ₱{shiftMetrics.grossSales.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold">
                Cash: ₱{shiftMetrics.cashSales.toLocaleString()}
              </p>
            </div>

            {/* Expected Cash in Drawer */}
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Expected Drawer Cash</span>
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">
                ₱{shiftMetrics.expectedCash.toLocaleString()}
              </h3>
              <p className="text-[11px] text-neutral-500">Float + Cash sales</p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Prompt to start shift */
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-neutral-900">
              Ready to Start Your Shift?
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Starting a shift session records your login time, tracks all orders and product sales under your account, and calculates your cash drawer balance automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsStartModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#BA1A20] hover:bg-[#9E1419] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Open Cash Register &amp; Start Shift</span>
          </button>
        </div>
      )}

      {/* Start Shift Modal */}
      <StartShiftModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStarted={() => refetch()}
        cashierName={user?.name || 'Cashier Staff'}
        cashierId={user?.id}
      />

      {/* End Shift & Logout Handover Modal */}
      {activeShift && (
        <ShiftHandoverModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onClosed={handleLogoutAfterClose}
          shift={activeShift}
          orders={orders}
        />
      )}
    </div>
  );
}
