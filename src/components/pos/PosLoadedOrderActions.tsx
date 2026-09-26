'use client';

import React from 'react';
import { Banknote, CreditCard, Check, Save, Printer } from 'lucide-react';
import { PaymentMethod } from '@/types';
import { usePosSettings } from '@/hooks/usePosSettings';

interface PosLoadedOrderActionsProps {
  total: number;
  hasItemsChanged: boolean;
  isPayDrawerOpen: boolean;
  setIsPayDrawerOpen: (open: boolean) => void;
  settleMethod: PaymentMethod;
  setSettleMethod: (m: PaymentMethod) => void;
  cashTendered: string;
  setCashTendered: (c: string) => void;
  changeDue: number;
  tenderedNum: number;
  isUpdatingItems: boolean;
  isSettling: boolean;
  onSaveItems: () => void;
  onSettle: () => void;
}

export function PosLoadedOrderActions({
  total,
  hasItemsChanged,
  isPayDrawerOpen,
  setIsPayDrawerOpen,
  settleMethod,
  setSettleMethod,
  cashTendered,
  setCashTendered,
  changeDue,
  tenderedNum,
  isUpdatingItems,
  isSettling,
  onSaveItems,
  onSettle,
}: PosLoadedOrderActionsProps) {
  const { enabledPaymentMethods } = usePosSettings();

  return (
    <div className="space-y-2">
      {/* If Pay Drawer is open */}
      {isPayDrawerOpen ? (
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 animate-in fade-in duration-100">
          {/* Method selector: Cash or Card */}
          <div className="grid grid-cols-2 gap-1.5">
            {enabledPaymentMethods.includes('cash') && (
              <button
                type="button"
                onClick={() => setSettleMethod('cash')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  settleMethod === 'cash'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
            )}
            {enabledPaymentMethods.includes('card') && (
              <button
                type="button"
                onClick={() => setSettleMethod('card')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  settleMethod === 'card'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            )}
          </div>

          {settleMethod === 'cash' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800">Cash Received from Customer</span>
                <span className="text-[11px] font-mono text-neutral-500">Bill: ₱{total.toLocaleString()}</span>
              </div>

              {/* Fast Cash Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCashTendered(total.toString())}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    cashTendered === total.toString() || (cashTendered === '' && tenderedNum === total)
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  Exact
                </button>
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      cashTendered === amt.toString()
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>

              {/* Custom Cash Tendered Input with clear label */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Amount Tendered (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">₱</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={`Enter cash tendered (e.g. ${total})`}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Cash Return / Change Due Display Box */}
              {cashTendered !== '' && (
                tenderedNum >= total ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                        Cash Return / Change Due
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        ₱{tenderedNum.toLocaleString()} received − ₱{total.toLocaleString()} bill
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono text-emerald-700">
                      ₱{(tenderedNum - total).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                        Insufficient Cash Tendered
                      </span>
                      <span className="text-[11px] text-rose-700">
                        Customer owes remaining balance
                      </span>
                    </div>
                    <span className="text-xs font-black font-mono text-rose-700">
                      Short by ₱{(total - tenderedNum).toLocaleString()}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-white rounded-lg border border-neutral-200 text-center space-y-1">
              <span className="text-xs font-medium text-neutral-600 block">
                Swipe or tap card on POS terminal
              </span>
              <span className="font-mono font-bold text-sm text-neutral-900 block">
                Charge: ₱{total.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsPayDrawerOpen(false)}
              className="flex-1 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSettle}
              disabled={isSettling || (settleMethod === 'cash' && cashTendered !== '' && tenderedNum < total)}
              className={`flex-1 py-2 rounded-lg text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs ${
                settleMethod === 'cash' && cashTendered !== '' && tenderedNum < total
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {settleMethod === 'cash' && cashTendered !== '' && tenderedNum < total
                  ? `Short by ₱${(total - tenderedNum).toLocaleString()}`
                  : settleMethod === 'cash' && tenderedNum > total
                  ? `Confirm (Return Change ₱${(tenderedNum - total).toLocaleString()})`
                  : 'Confirm & Print'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Update Order (if items were edited) */}
          {hasItemsChanged && (
            <button
              type="button"
              onClick={onSaveItems}
              disabled={isUpdatingItems}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isUpdatingItems ? 'Updating...' : 'Update Order'}</span>
            </button>
          )}

          {/* Settle Bill Button */}
          <button
            type="button"
            onClick={() => {
              setCashTendered(total.toString());
              setIsPayDrawerOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Pay &amp; Close (₱{total.toLocaleString()})</span>
          </button>
        </div>
      )}
    </div>
  );
}
