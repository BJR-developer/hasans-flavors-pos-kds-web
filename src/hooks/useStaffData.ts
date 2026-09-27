'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStaffUsers,
  createStaffAccount,
  resetPasswordDirect,
  updateStaffProfile,
  updateStaffUsername,
  deleteStaffAccount,
} from '@/lib/staffApi';
import { StaffUser } from '@/types';

export const STAFF_QUERY_KEYS = {
  staffUsers: ['staffUsers'] as const,
};

export function useStaffUsers() {
  return useQuery<StaffUser[]>({
    queryKey: STAFF_QUERY_KEYS.staffUsers,
    queryFn: fetchStaffUsers,
    staleTime: 1000 * 30,
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      username: string;
      email?: string;
      password: string;
      fullName: string;
      phone?: string;
      role?: 'cashier' | 'owner';
    }) => createStaffAccount(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.staffUsers });
    },
  });
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteStaffAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.staffUsers });
    },
  });
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: (params: { usernameOrEmail: string; newPassword: string }) =>
      resetPasswordDirect(params.usernameOrEmail, params.newPassword),
  });
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; fullName?: string; phone?: string }) =>
      updateStaffProfile(params.userId, {
        fullName: params.fullName,
        phone: params.phone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.staffUsers });
    },
  });
}

export function useUpdateStaffUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; username: string }) =>
      updateStaffUsername(params.userId, params.username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.staffUsers });
    },
  });
}
