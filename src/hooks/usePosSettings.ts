import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaymentMethod, PosSettings, VatApplicability } from '@/types';

export interface PosSettingsStore extends PosSettings {
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  setVatEnabled: (enabled: boolean) => void;
  setVatRate: (rate: number) => void;
  setVatApplicability: (applicability: VatApplicability) => void;
  setPaymentEnabled: (enabled: boolean) => void;
  togglePaymentMethod: (method: PaymentMethod) => void;
  setEnabledPaymentMethods: (methods: PaymentMethod[]) => void;
  setDefaultPaymentTiming: (timing: 'pay_now' | 'pay_later') => void;
  resetSettings: () => void;
  calculateTax: (subtotal: number, paymentMethod?: PaymentMethod | null) => number;
}

export const DEFAULT_POS_SETTINGS: PosSettings = {
  vatEnabled: true,
  vatRate: 5,
  vatApplicability: 'card_only',
  paymentEnabled: true,
  enabledPaymentMethods: ['cash', 'card', 'gcash', 'inr_qr'],
  defaultPaymentTiming: 'pay_later',
};

export const usePosSettings = create<PosSettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_POS_SETTINGS,
      isSettingsModalOpen: false,

      setIsSettingsModalOpen: (isSettingsModalOpen: boolean) => set({ isSettingsModalOpen }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),

      setVatEnabled: (vatEnabled: boolean) => set({ vatEnabled }),

      setVatRate: (vatRate: number) => {
        const safeRate = Math.max(0, Math.min(100, Number(vatRate) || 0));
        set({ vatRate: safeRate });
      },

      setVatApplicability: (vatApplicability: VatApplicability) => set({ vatApplicability }),

      setPaymentEnabled: (paymentEnabled: boolean) => set({ paymentEnabled }),

      togglePaymentMethod: (method: PaymentMethod) => {
        const current = get().enabledPaymentMethods;
        const exists = current.includes(method);
        // Ensure at least one payment method remains enabled if payment collection is on
        if (exists && current.length <= 1) {
          return;
        }
        const next = exists ? current.filter((m) => m !== method) : [...current, method];
        set({ enabledPaymentMethods: next });
      },

      setEnabledPaymentMethods: (enabledPaymentMethods: PaymentMethod[]) =>
        set({ enabledPaymentMethods }),

      setDefaultPaymentTiming: (defaultPaymentTiming: 'pay_now' | 'pay_later') =>
        set({ defaultPaymentTiming }),

      resetSettings: () => set({ ...DEFAULT_POS_SETTINGS }),

      calculateTax: (subtotal: number, paymentMethod?: PaymentMethod | null) => {
        const { vatEnabled, vatRate, vatApplicability } = get();
        if (!vatEnabled || subtotal <= 0 || vatRate <= 0) {
          return 0;
        }

        // If VAT is restricted to Card (Debit/Credit) payments only
        if (vatApplicability === 'card_only') {
          return paymentMethod === 'card' ? Math.round(subtotal * (vatRate / 100)) : 0;
        }

        // Universal VAT across all methods
        return Math.round(subtotal * (vatRate / 100));
      },
    }),
    {
      name: 'hasan_pos_settings_v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : ({} as Storage))),
      partialize: (state) => ({
        vatEnabled: state.vatEnabled,
        vatRate: state.vatRate,
        vatApplicability: state.vatApplicability,
        paymentEnabled: state.paymentEnabled,
        enabledPaymentMethods: state.enabledPaymentMethods,
        defaultPaymentTiming: state.defaultPaymentTiming,
      }),
    }
  )
);
