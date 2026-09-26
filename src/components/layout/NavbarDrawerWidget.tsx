'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  X,
  Check,
  History,
  Edit3,
  ArrowRight,
  DollarSign,
  Banknote,
  Smartphone,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useActiveShift, useUpdateShiftOpeningCash, useStartShift } from '@/hooks/useShiftData';
import { useOrders } from '@/hooks/useRestaurantData';

export function NavbarDrawerWidget() {
  const { user } = useAuthStore();
  const { data: activeShift, isLoading } = useActiveShift(user?.id);
  const { data: orders = [] } = useOrders();
  const updateOpeningCashMutation = useUpdateShiftOpeningCash();
  const startShiftMutation = useStartShift();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newFloat, setNewFloat] = useState('');
  const [editReason, setEditReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate today's real orders and sales directly inside the app
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const todayOrders = React.useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.status === 'cancelled' || o.status === 'draft') return false;
      // If logged in as cashier, exclude orders explicitly taken by a different cashier
      if (user && user.role === 'cashier' && o.cashierId && o.cashierId !== user.id) {
        return false;
      }
      return isSameDay(new Date(o.createdAt), now);
    });
  }, [orders, user]);

  const paymentBreakdown = React.useMemo(() => {
    let cash = { amount: 0, count: 0 };
    let gcash = { amount: 0, count: 0 };
    let card = { amount: 0, count: 0 };
    let inr = { amount: 0, count: 0 };
    let online = { amount: 0, count: 0 };

    todayOrders.forEach((o) => {
      const method = (o.paymentMethod || '').toLowerCase();
      const amt = Number(o.amountPaid || o.total || 0);

      if (method === 'cash') {
        cash.amount += amt;
        cash.count += 1;
      } else if (method === 'gcash') {
        gcash.amount += amt;
        gcash.count += 1;
      } else if (method === 'card') {
        card.amount += amt;
        card.count += 1;
      } else if (method === 'inr_qr' || method === 'inr' || method === 'upi') {
        inr.amount += amt;
        inr.count += 1;
      } else {
        online.amount += amt;
        online.count += 1;
      }
    });

    return { cash, gcash, card, inr, online };
  }, [todayOrders]);

  const grossSales = React.useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [todayOrders]);

  const cashSales = paymentBreakdown.cash.amount;
  const digitalSales =
    paymentBreakdown.gcash.amount +
    paymentBreakdown.card.amount +
    paymentBreakdown.inr.amount +
    paymentBreakdown.online.amount;

  if (isLoading || !user) return null;

  const openingCash = Number(activeShift?.openingCash || 0);
  const estimatedCashInDrawer = openingCash + cashSales;
  const totalAccountedMoney = openingCash + grossSales; // estimatedCashInDrawer + digitalSales (1,192 + 320 = 1,512)
  const auditEdits = activeShift?.initialFloatEdits || [];

  const handleOpenModal = () => {
    setNewFloat(String(openingCash));
    setEditReason('');
    setErrorMsg('');
    setIsEditing(false);
    setIsOpen(true);
  };

  const handleSaveFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newFloat);
    if (isNaN(val) || val < 0) {
      setErrorMsg('Please enter a valid non-negative cash amount.');
      return;
    }

    try {
      if (activeShift) {
        await updateOpeningCashMutation.mutateAsync({
          shiftId: activeShift.id,
          newOpeningCash: val,
          changedBy: user.name || user.email || 'Cashier',
          reason: editReason.trim() || 'Manual drawer float adjustment',
        });
      } else {
        // Start shift with this opening float
        await startShiftMutation.mutateAsync({
          cashierId: user.id,
          cashierName: user.name || user.email || 'Staff Cashier',
          openingCash: val,
        });
      }
      setIsEditing(false);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update drawer float.');
    }
  };

  return (
    <>
      {/* Navbar Drawer Trigger Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        title="View & manage cash drawer float and sales"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[#1F1F1F] hover:border-[#A3A3A3] hover:shadow-2xs transition-all text-xs font-semibold cursor-pointer shrink-0"
      >
        <Wallet className="w-3.5 h-3.5 text-[#BA1A20]" />
        <span className="hidden sm:inline text-[#737373] font-normal">Drawer Cash:</span>
        <span className="font-bold text-[#1F1F1F]">₱{estimatedCashInDrawer.toLocaleString()}</span>
        <span className="text-[#D4D4D4] hidden md:inline">•</span>
        <span className="hidden md:inline text-[#737373] font-normal">Sales:</span>
        <span className="hidden md:inline font-bold text-[#2E7D32]">₱{grossSales.toLocaleString()}</span>
      </button>

      {/* Drawer Details & Edit Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] overflow-hidden z-10"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF2F0] border border-[#FECDD3] flex items-center justify-center text-[#BA1A20]">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Cash Drawer &amp; Session Float</h3>
                    <p className="text-[11px] text-[#737373]">Live register balance and float tracking</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Card 1: Physical Cash in Drawer */}
                  <div className="p-3 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-center">
                    <span className="text-[10px] font-bold text-[#B45309] block uppercase tracking-wider">Drawer Cash</span>
                    <span className="text-base font-black text-[#B45309] mt-0.5 block">₱{estimatedCashInDrawer.toLocaleString()}</span>
                    <span className="text-[9px] text-[#B45309]/80 block mt-0.5">Float ₱{openingCash.toLocaleString()} + Cash ₱{cashSales.toLocaleString()}</span>
                  </div>

                  {/* Card 2: GCash, Card, INR & Digital Payments */}
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                    <span className="text-[10px] font-bold text-blue-700 block uppercase tracking-wider">Digital / Online</span>
                    <span className="text-base font-black text-blue-900 mt-0.5 block">₱{digitalSales.toLocaleString()}</span>
                    <span className="text-[9px] text-blue-700/80 block mt-0.5">GCash, Card &amp; INR</span>
                  </div>

                  {/* Card 3: Grand Total Accounted */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">Total Money</span>
                    <span className="text-base font-black text-emerald-900 mt-0.5 block">₱{totalAccountedMoney.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-700 block mt-0.5">Drawer + Digital</span>
                  </div>
                </div>

                {/* Calculation Transparency Formula */}
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#737373]">
                    <span>1. Starting Drawer Float (Morning Fund):</span>
                    <span className="font-bold text-[#1F1F1F]">₱{openingCash.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#737373]">
                    <span>2. Today's Total Sales Revenue:</span>
                    <span className="font-bold text-[#2E7D32]">
                      ₱{grossSales.toLocaleString()} (Cash: ₱{cashSales.toLocaleString()} + Digital: ₱{digitalSales.toLocaleString()})
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-[#1F1F1F] font-bold">Total Money Accounted For (Drawer + Digital):</span>
                    <span className="font-mono font-bold text-[#1F1F1F]">
                      ₱{estimatedCashInDrawer.toLocaleString()} (Drawer Cash) + ₱{digitalSales.toLocaleString()} (Digital) = <strong className="text-emerald-700 font-black">₱{totalAccountedMoney.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Payment Channels Breakdown */}
                <div className="rounded-xl border border-[#E5E5E5] p-3 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1F1F1F] uppercase tracking-wider">
                      Payment Channels (Today)
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      Total: <strong>₱{grossSales.toLocaleString()}</strong> ({todayOrders.length} orders)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Cash */}
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                      <div className="flex items-center justify-between text-emerald-800 text-[11px] font-semibold">
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3 h-3 text-emerald-600" />
                          <span>Cash</span>
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1 py-0.2 rounded font-bold">
                          {paymentBreakdown.cash.count}
                        </span>
                      </div>
                      <p className="text-xs font-black text-emerald-900 mt-1">
                        ₱{paymentBreakdown.cash.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* GCash */}
                    <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/80">
                      <div className="flex items-center justify-between text-blue-800 text-[11px] font-semibold">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          <span>GCash</span>
                        </span>
                        <span className="text-[9px] bg-blue-100 text-blue-900 px-1 py-0.2 rounded font-bold">
                          {paymentBreakdown.gcash.count}
                        </span>
                      </div>
                      <p className="text-xs font-black text-blue-900 mt-1">
                        ₱{paymentBreakdown.gcash.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* Card */}
                    <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-200/80">
                      <div className="flex items-center justify-between text-purple-800 text-[11px] font-semibold">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-purple-600" />
                          <span>Card</span>
                        </span>
                        <span className="text-[9px] bg-purple-100 text-purple-900 px-1 py-0.2 rounded font-bold">
                          {paymentBreakdown.card.count}
                        </span>
                      </div>
                      <p className="text-xs font-black text-purple-900 mt-1">
                        ₱{paymentBreakdown.card.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* INR / QR */}
                    <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80">
                      <div className="flex items-center justify-between text-amber-800 text-[11px] font-semibold">
                        <span className="flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-amber-600" />
                          <span>INR / QR</span>
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">
                          {paymentBreakdown.inr.count}
                        </span>
                      </div>
                      <p className="text-xs font-black text-amber-900 mt-1">
                        ₱{paymentBreakdown.inr.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Initial Drawer Section */}
                {!isEditing ? (
                  <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1F1F1F] block">Initial Drawer Amount</span>
                      <span className="text-[11px] text-[#737373]">Starting cash float: ₱{openingCash.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFloat(String(openingCash));
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white text-xs font-semibold text-[#1F1F1F] hover:border-[#1F1F1F] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#BA1A20]" />
                      <span>Edit Float</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveFloat} className="p-3.5 rounded-xl border border-[#BA1A20]/30 bg-[#FFF2F0]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F1F1F]">Edit Initial Drawer Float</span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-[11px] font-semibold text-[#737373] hover:text-[#1F1F1F] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#525252] mb-1">New Starting Float (₱) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={newFloat}
                        onChange={(e) => setNewFloat(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E5E5E5] bg-white text-[#1F1F1F] focus:outline-none focus:border-[#BA1A20]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#525252] mb-1">Reason for Adjustment *</label>
                      <input
                        type="text"
                        required
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="e.g. Added change fund / correction"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-white text-[#1F1F1F] focus:outline-none focus:border-[#BA1A20]"
                      />
                    </div>

                    {errorMsg && <p className="text-[11px] text-[#BA1A20] font-medium">{errorMsg}</p>}

                    <button
                      type="submit"
                      disabled={updateOpeningCashMutation.isPending || startShiftMutation.isPending}
                      className="w-full py-2 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{updateOpeningCashMutation.isPending ? 'Saving...' : 'Confirm & Save Float'}</span>
                    </button>
                  </form>
                )}

                {/* Audit Trail of Edits */}
                <div className="space-y-2 pt-2 border-t border-[#F5F5F5]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1F1F]">
                    <History className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Drawer Float Audit Log</span>
                  </div>

                  {auditEdits.length === 0 ? (
                    <p className="text-[11px] text-[#A3A3A3] italic bg-[#FAFAFA] p-2.5 rounded-lg border border-[#E5E5E5]">
                      No previous edits recorded for this session.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {auditEdits.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-[11px]">
                          <div className="flex items-center justify-between font-semibold text-[#1F1F1F]">
                            <span>₱{Number(item.previousAmount || 0).toLocaleString()} <ArrowRight className="inline w-2.5 h-2.5 text-[#737373]" /> ₱{Number(item.newAmount || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-[#737373]">
                              {item.changedAt ? new Date(item.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[#737373] text-[10px] mt-0.5">
                            <span>By: {item.changedBy || 'Staff'}</span>
                            <span className="italic">{item.reason || 'Float adjusted'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
