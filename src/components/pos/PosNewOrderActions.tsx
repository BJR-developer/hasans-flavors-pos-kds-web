'use client';

import React from 'react';
import { Banknote, CreditCard, Send, Printer, Clock } from 'lucide-react';
import { OrderType, PaymentMethod } from '@/types';
import { usePosSettings } from '@/hooks/usePosSettings';

interface PosNewOrderActionsProps {
  orderType: OrderType;
  selectedTable: string;
  total: number;
  itemsCount: number;
  isPending: boolean;
  paymentTiming: 'pay_now' | 'pay_later';
  setPaymentTiming: (timing: 'pay_now' | 'pay_later') => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashTendered: string;
  setCashTendered: (val: string) => void;
  tenderedNum: number;
  changeDue: number;
  prepTimeMinutes?: number;
  setPrepTimeMinutes?: (mins: number) => void;
  onSubmit: () => void;
}

export function PosNewOrderActions({
  orderType,
  selectedTable,
  total,
  itemsCount,
  isPending,
  paymentTiming,
  setPaymentTiming,
  paymentMethod,
  setPaymentMethod,
  cashTendered,
  setCashTendered,
  tenderedNum,
  changeDue,
  prepTimeMinutes,
  setPrepTimeMinutes,
  onSubmit,
}: PosNewOrderActionsProps) {
  const { paymentEnabled, enabledPaymentMethods } = usePosSettings();

  const isCashInsufficient =
    paymentMethod === 'cash' && cashTendered !== '' && tenderedNum < total;
  const isCashWithChange =
    paymentMethod === 'cash' && cashTendered !== '' && tenderedNum > total;

  if (!paymentEnabled) {
    return (
      <button
        type="button"
        onClick={onSubmit}
        disabled={itemsCount === 0 || isPending}
        className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        <span>
          {isPending
            ? 'Sending to Kitchen...'
            : `Send to Kitchen (Unpaid • ₱${total.toLocaleString()})`}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Timing Toggle */}
      <div className="bg-[#F5F5F5] p-1 rounded-lg flex items-center text-xs font-semibold">
        <button
          type="button"
          onClick={() => setPaymentTiming('pay_later')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
            paymentTiming === 'pay_later'
              ? 'bg-white text-ink shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>
            {orderType === 'dine_in' ? 'Pay Later (Standard)' : 'Pay on Pickup'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentTiming('pay_now')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
            paymentTiming === 'pay_now'
              ? 'bg-white text-ink shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span>Pay Now</span>
        </button>
      </div>

      {paymentTiming === 'pay_now' && (
        <div className="space-y-2 pt-1">
          {/* Method selector for Pay Now filtered by enabledPaymentMethods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {enabledPaymentMethods.includes('cash') && (
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  paymentMethod === 'cash'
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
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  paymentMethod === 'card'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            )}
            {enabledPaymentMethods.includes('gcash') && (
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  paymentMethod === 'gcash'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <span>GCash</span>
              </button>
            )}
            {enabledPaymentMethods.includes('inr_qr') && (
              <button
                type="button"
                onClick={() => setPaymentMethod('inr_qr')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  paymentMethod === 'inr_qr'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <span>INR QR</span>
              </button>
            )}
          </div>


          {paymentMethod === 'cash' && (
            <div className="space-y-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70">
              {/* Clear Header Label */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800">Cash Received from Customer</span>
                <span className="text-xs font-mono text-neutral-500">Bill: ₱{total.toLocaleString()}</span>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCashTendered(total.toString())}
                  disabled={itemsCount === 0}
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
                    disabled={itemsCount === 0}
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
                <label className="block text-xs font-medium text-neutral-600 mb-1">
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
                    disabled={itemsCount === 0}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Cash Return / Change Due Display Box */}
              {cashTendered !== '' && (
                tenderedNum >= total ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 block">
                        Cash Return / Change Due
                      </span>
                      <span className="text-xs text-emerald-700">
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
                      <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 block">
                        Insufficient Cash Tendered
                      </span>
                      <span className="text-xs text-rose-700">
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
          )}
        </div>
      )}

      {/* Quick Kitchen Prep ETA Selector */}
      {prepTimeMinutes !== undefined && setPrepTimeMinutes && (
        <div className="flex items-center justify-between px-1 py-1 text-xs border border-neutral-100 bg-neutral-50/70 rounded-lg">
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-xs font-semibold text-neutral-700">Kitchen Prep ETA:</span>
          </div>
          <div className="flex items-center gap-1">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPrepTimeMinutes(mins)}
                className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                  prepTimeMinutes === mins
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Submit Action */}
      {paymentTiming === 'pay_later' ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={itemsCount === 0 || isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>
            {isPending
              ? 'Sending Order...'
              : orderType === 'dine_in'
              ? `Send to Kitchen (${selectedTable} • Pay Later)`
              : `Place Order (Pay Later • ₱${total.toLocaleString()})`}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={itemsCount === 0 || isPending || isCashInsufficient}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
            isCashInsufficient
              ? 'bg-neutral-400'
              : 'bg-money hover:bg-[#1B5E20]'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>
            {isPending
              ? 'Processing Payment...'
              : isCashInsufficient
              ? `Insufficient Cash (Short by ₱${(total - tenderedNum).toLocaleString()})`
              : isCashWithChange
              ? `Charge ₱${total.toLocaleString()} • Return Change: ₱${(tenderedNum - total).toLocaleString()}`
              : `Charge & Send • ₱${total.toLocaleString()}`}
          </span>
        </button>
      )}
    </div>
  );
}
