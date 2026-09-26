'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
} from 'lucide-react';
import { usePosSettings } from '@/hooks/usePosSettings';
import { PaymentMethod } from '@/types';

interface PosSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_OPTIONS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash Tender', icon: Banknote },
  { id: 'card', label: 'Debit / Card', icon: CreditCard },
  { id: 'gcash', label: 'GCash e-Wallet', icon: Smartphone },
  { id: 'inr_qr', label: 'INR UPI QR', icon: QrCode },
];

export function PosSettingsModal({ isOpen, onClose }: PosSettingsModalProps) {
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
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 leading-tight">
                    Register &amp; Financial Settings
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Configure cashier VAT rules and POS payment behaviors
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* SECTION 1: VAT / TAX SETTINGS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Tax &amp; VAT Settings
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                <div className={`p-3.5 rounded-xl border transition-all ${
                  vatEnabled ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-100/60 border-dashed border-neutral-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 mb-2">
                    <span>VAT Calculation</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      vatEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {vatEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {vatEnabled && (
                    <div className="space-y-3 pt-1">
                      {/* VAT Applicability Rule */}
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 block mb-1.5">
                          VAT Applicability Target:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setVatApplicability('card_only')}
                            className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                              vatApplicability === 'card_only'
                                ? 'bg-white border-neutral-900 ring-1 ring-neutral-900 shadow-2xs'
                                : 'bg-white/60 border-neutral-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-neutral-900">Debit / Card Only</span>
                              {vatApplicability === 'card_only' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-0.5">
                              VAT applied only when paying via Card. Cash is 0% exempt.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVatApplicability('all')}
                            className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                              vatApplicability === 'all'
                                ? 'bg-white border-neutral-900 ring-1 ring-neutral-900 shadow-2xs'
                                : 'bg-white/60 border-neutral-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-neutral-900">All Transactions</span>
                              {vatApplicability === 'all' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-0.5">
                              VAT applied uniformly regardless of payment method.
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* VAT Percentage Rate */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80">
                        <div>
                          <span className="text-xs font-semibold text-neutral-800 block">VAT Percentage Rate</span>
                          <span className="text-[10px] text-neutral-500">Calculated on order subtotal</span>
                        </div>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={vatRate}
                            onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                            className="w-full pl-3 pr-7 py-1 text-xs font-mono font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                          />
                          <Percent className="w-3 h-3 text-neutral-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: PAYMENT REGISTER CONTROLS */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Payment Collection Controls
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentEnabled}
                      onChange={(e) => setPaymentEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-800 block">Payment Mandatory at POS</span>
                      <span className="text-[10px] text-neutral-500">
                        {paymentEnabled
                          ? 'Cashier requires tender or settlement'
                          : 'Bypass tender: 1-click fire to KDS without payment'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      paymentEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {paymentEnabled ? 'Enabled' : 'Bypassed'}
                    </span>
                  </div>

                  {paymentEnabled && (
                    <div className="space-y-2 pt-2 border-t border-neutral-200/80">
                      <label className="text-[11px] font-medium text-neutral-600 block">
                        Accepted POS Payment Methods:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHOD_OPTIONS.map((item) => {
                          const isChecked = enabledPaymentMethods.includes(item.id);
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => togglePaymentMethod(item.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                                isChecked
                                  ? 'bg-white border-neutral-900 text-neutral-900 shadow-2xs font-semibold'
                                  : 'bg-white/40 border-neutral-200 text-neutral-400 hover:bg-white'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <IconComp className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-xs truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: DEFAULT TIMING */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-700" />
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Default Payment Timing
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultPaymentTiming('pay_later')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      defaultPaymentTiming === 'pay_later'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">Pay Later (Dine-in Tab)</span>
                    <span className={`text-[10px] block mt-0.5 ${
                      defaultPaymentTiming === 'pay_later' ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>
                      Order fired directly to kitchen; settled later
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultPaymentTiming('pay_now')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      defaultPaymentTiming === 'pay_now'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">Pay Now (Immediate)</span>
                    <span className={`text-[10px] block mt-0.5 ${
                      defaultPaymentTiming === 'pay_now' ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>
                      Collect cash/card tender upfront
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={resetSettings}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
