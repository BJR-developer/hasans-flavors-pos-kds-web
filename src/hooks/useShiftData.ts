'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchShifts,
  fetchActiveShift,
  startShift,
  closeShift,
  updateShiftOpeningCash,
} from '@/lib/shiftApi';
import { Shift } from '@/types';

export const SHIFT_QUERY_KEYS = {
  shifts: ['shifts'] as const,
  activeShift: (cashierId?: string) => ['activeShift', cashierId || 'any'] as const,
};

export function useShifts() {
  return useQuery<Shift[]>({
    queryKey: SHIFT_QUERY_KEYS.shifts,
    queryFn: fetchShifts,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useActiveShift(cashierId?: string) {
  return useQuery<Shift | null>({
    queryKey: SHIFT_QUERY_KEYS.activeShift(cashierId),
    queryFn: () => fetchActiveShift(cashierId),
    staleTime: 1000 * 15,
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      cashierId?: string;
      cashierName: string;
      openingCash: number;
    }) => startShift(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFT_QUERY_KEYS.shifts });
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      shiftId: string;
      closingCash: number;
      expectedCash: number;
      cashDifference: number;
      totalOrders: number;
      totalItemsSold?: number;
      grossSales: number;
      cashSales: number;
      cardSales: number;
      onlineSales: number;
      totalDiscount: number;
      notes?: string;
    }) => closeShift(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFT_QUERY_KEYS.shifts });
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });
}

export function useUpdateShiftOpeningCash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      shiftId: string;
      newOpeningCash: number;
      changedBy: string;
      reason?: string;
    }) => updateShiftOpeningCash(params),
    onSuccess: (updatedShift) => {
      queryClient.setQueriesData({ queryKey: ['activeShift'] }, updatedShift);
      queryClient.invalidateQueries({ queryKey: SHIFT_QUERY_KEYS.shifts });
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    },
  });
}
