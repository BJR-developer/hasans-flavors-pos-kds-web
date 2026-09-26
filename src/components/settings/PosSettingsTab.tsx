'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  Receipt,
  Percent,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  RotateCcw,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { usePosSettings } from '@/hooks/usePosSettings';
import { PaymentMethod } from '@/types';

const PAYMENT_METHOD_OPTIONS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash Tender', icon: Banknote },
  { id: 'card', label: 'Debit / Card', icon: CreditCard },
  { id: 'gcash', label: 'GCash e-Wallet', icon: Smartphone },
  { id: 'inr_qr', label: 'INR UPI QR', icon: QrCode },
];

export function PosSettingsTab() {
  const {
    vatEnabled,
    vatRate,
    vatApplicability,
    paymentEnabled,
    enabledPaymentMethods,
    defaultPaymentTiming,
    setVatEnabled,
    setVatRate,
    setVatApplicability,
    setPaymentEnabled,
    togglePaymentMethod,
    setDefaultPaymentTiming,
    resetSettings,
  } = usePosSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* SECTION 1: VALUE ADDED TAX (VAT) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#BA1A20]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">
                Value Added Tax (VAT / Sales Tax)
              </h3>
              <p className="text-xs text-neutral-500">
                Configure whether tax is charged and which payment channels require it
              </p>
            </div>
          </div>

          {/* Master VAT Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={vatEnabled}
            onClick={() => setVatEnabled(!vatEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              vatEnabled ? 'bg-[#BA1A20]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                vatEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {vatEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-1"
          >
            {/* VAT Rate Percentage Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-neutral-800">
                  Tax Percentage Rate
                </label>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Applied as a percentage of the subtotal
                </p>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-3 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <Percent className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* VAT Applicability Rule */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-bold text-neutral-800">
                Tax Applicability Rule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Card Only */}
                <button
                  type="button"
                  onClick={() => setVatApplicability('card_only')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    vatApplicability === 'card_only'
                      ? 'border-[#BA1A20] bg-rose-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-900">Debit / Card Only</span>
                    {vatApplicability === 'card_only' && (
                      <Check className="w-4 h-4 text-[#BA1A20]" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    VAT applies only when customer pays via Debit or Credit card. Cash &amp; e-wallets are exempt.
                  </p>
                </button>

                {/* Option 2: All Payments */}
                <button
                  type="button"
                  onClick={() => setVatApplicability('all')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    vatApplicability === 'all'
                      ? 'border-[#BA1A20] bg-rose-50/40 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-900">All Payment Methods</span>
                    {vatApplicability === 'all' && (
                      <Check className="w-4 h-4 text-[#BA1A20]" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Standard universal VAT charged on every single transaction regardless of payment method.
                  </p>
                </button>
              </div>
            </div>

            {/* Live Preview Calculation */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-neutral-700 block">Calculation Preview:</span>
                <span className="text-[11px] text-neutral-500">
                  On a ₱1,000 order {vatApplicability === 'card_only' ? '(Card payment)' : '(Any payment)'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-neutral-900 block">
                  ₱{Math.round(1000 * (vatRate / 100)).toLocaleString()} VAT
                </span>
                <span className="text-[10px] text-neutral-500">
                  Total: ₱{(1000 + Math.round(1000 * (vatRate / 100))).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* SECTION 2: PAYMENT PROCESSING & METHODS */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">
                Payment Collection &amp; Behaviors
              </h3>
              <p className="text-xs text-neutral-500">
                Enable or disable cashier payment steps and checkout channels
              </p>
            </div>
          </div>

          {/* Master Payment Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={paymentEnabled}
            onClick={() => setPaymentEnabled(!paymentEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              paymentEnabled ? 'bg-[#2E7D32]' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                paymentEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {paymentEnabled ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-1"
          >
            {/* Enabled Payment Methods Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-800">
                Accepted Payment Channels in Register
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PAYMENT_METHOD_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isChecked = enabledPaymentMethods.includes(opt.id);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => togglePaymentMethod(opt.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                        isChecked
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default Timing */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-bold text-neutral-800">
                Default Order Settlement Flow
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultPaymentTiming('pay_later')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    defaultPaymentTiming === 'pay_later'
                      ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-900">
                      Pay Later (Standard Dining)
                    </span>
                    {defaultPaymentTiming === 'pay_later' && (
                      <Check className="w-4 h-4 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Send order immediately to kitchen, settle payment when diner requests bill.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultPaymentTiming('pay_now')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    defaultPaymentTiming === 'pay_now'
                      ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-900">
                      Pay Now (Counter / Fast Food)
                    </span>
                    {defaultPaymentTiming === 'pay_now' && (
                      <Check className="w-4 h-4 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Cashier collects cash or card before sending tickets to kitchen.
                  </p>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>
              Payment collection is currently bypassed. All orders are sent directly to the kitchen as unpaid.
            </span>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={resetSettings}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Factory Defaults</span>
        </button>

        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Settings automatically saved to browser storage</span>
        </div>
      </div>
    </motion.div>
  );
}
