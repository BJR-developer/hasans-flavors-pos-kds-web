import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PaymentMethod, PosSettings, VatApplicability } from '@/types';

// Extended type – only used internally, not exported to src/types/index.ts
export interface PosSettingsExtended extends PosSettings {
  cashiersCanEditPos: boolean;
}

export interface PosSettingsStore extends PosSettingsExtended {
  isLoading: boolean;
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
  setCashiersCanEditPos: (enabled: boolean) => void;
  resetSettings: () => void;
  calculateTax: (subtotal: number, paymentMethod?: PaymentMethod | null) => number;
}

export const DEFAULT_POS_SETTINGS: PosSettingsExtended = {
  vatEnabled: true,
  vatRate: 5,
  vatApplicability: 'card_only',
  paymentEnabled: true,
  enabledPaymentMethods: ['cash', 'card', 'gcash', 'inr_qr'],
  defaultPaymentTiming: 'pay_later',
  cashiersCanEditPos: true,
};

const POS_QUERY_KEY = ['app_settings', 'pos'] as const;

async function fetchPosSettings(): Promise<PosSettingsExtended> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'pos')
    .single();

  if (error || !data) {
    return DEFAULT_POS_SETTINGS;
  }

  const v = data.value as Record<string, unknown>;
  return {
    vatEnabled: typeof v.vatEnabled === 'boolean' ? v.vatEnabled : DEFAULT_POS_SETTINGS.vatEnabled,
    vatRate: typeof v.vatRate === 'number' ? v.vatRate : DEFAULT_POS_SETTINGS.vatRate,
    vatApplicability: (v.vatApplicability as VatApplicability) || DEFAULT_POS_SETTINGS.vatApplicability,
    paymentEnabled: typeof v.paymentEnabled === 'boolean' ? v.paymentEnabled : DEFAULT_POS_SETTINGS.paymentEnabled,
    enabledPaymentMethods: Array.isArray(v.enabledPaymentMethods)
      ? (v.enabledPaymentMethods as PaymentMethod[])
      : DEFAULT_POS_SETTINGS.enabledPaymentMethods,
    defaultPaymentTiming: (v.defaultPaymentTiming as 'pay_now' | 'pay_later') || DEFAULT_POS_SETTINGS.defaultPaymentTiming,
    cashiersCanEditPos: typeof v.cashiersCanEditPos === 'boolean' ? v.cashiersCanEditPos : true,
  };
}

async function savePosSettings(settings: PosSettingsExtended): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      { key: 'pos', value: settings as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export function usePosSettings(): PosSettingsStore {
  const queryClient = useQueryClient();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { data: settings, isLoading } = useQuery<PosSettingsExtended>({
    queryKey: POS_QUERY_KEY,
    queryFn: fetchPosSettings,
    staleTime: 1000 * 60,
    placeholderData: DEFAULT_POS_SETTINGS,
  });

  const current: PosSettingsExtended = settings ?? DEFAULT_POS_SETTINGS;

  const mutation = useMutation({
    mutationFn: savePosSettings,
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: POS_QUERY_KEY });
      const previous = queryClient.getQueryData<PosSettingsExtended>(POS_QUERY_KEY);
      queryClient.setQueryData(POS_QUERY_KEY, newSettings);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  function patch(partial: Partial<PosSettingsExtended>) {
    const next = { ...current, ...partial };
    mutation.mutate(next);
  }

  const calculateTax = (subtotal: number, paymentMethod?: PaymentMethod | null): number => {
    const { vatEnabled, vatRate, vatApplicability } = current;
    if (!vatEnabled || subtotal <= 0 || vatRate <= 0) return 0;
    if (vatApplicability === 'card_only') {
      return paymentMethod === 'card' ? Math.round(subtotal * (vatRate / 100)) : 0;
    }
    return Math.round(subtotal * (vatRate / 100));
  };

  return {
    // Current settings values
    ...current,
    isLoading,

    // Modal state
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    openSettingsModal: () => setIsSettingsModalOpen(true),
    closeSettingsModal: () => setIsSettingsModalOpen(false),

    // Setters
    setVatEnabled: (vatEnabled) => patch({ vatEnabled }),
    setVatRate: (vatRate) => {
      const safeRate = Math.max(0, Math.min(100, Number(vatRate) || 0));
      patch({ vatRate: safeRate });
    },
    setVatApplicability: (vatApplicability) => patch({ vatApplicability }),
    setPaymentEnabled: (paymentEnabled) => patch({ paymentEnabled }),
    togglePaymentMethod: (method) => {
      const exists = current.enabledPaymentMethods.includes(method);
      if (exists && current.enabledPaymentMethods.length <= 1) return;
      const enabledPaymentMethods = exists
        ? current.enabledPaymentMethods.filter((m) => m !== method)
        : [...current.enabledPaymentMethods, method];
      patch({ enabledPaymentMethods });
    },
    setEnabledPaymentMethods: (enabledPaymentMethods) => patch({ enabledPaymentMethods }),
    setDefaultPaymentTiming: (defaultPaymentTiming) => patch({ defaultPaymentTiming }),
    setCashiersCanEditPos: (cashiersCanEditPos) => patch({ cashiersCanEditPos }),
    resetSettings: () => mutation.mutate(DEFAULT_POS_SETTINGS),
    calculateTax,
  };
}
