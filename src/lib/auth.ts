'use client';

import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

const AUTH_STORAGE_KEY = 'hasan_auth_user_v1';

export const DEMO_ACCOUNTS: Record<UserRole, UserProfile> = {
  staff: {
    id: 'usr_staff_01',
    name: 'Tariq Khan',
    email: 'staff@hasan.com',
    role: 'staff',
    roleLabel: 'Staff Cashier (POS)',
    avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&q=80',
  },
  kds: {
    id: 'usr_kds_01',
    name: 'Chef Zubair',
    email: 'kds@hasan.com',
    role: 'kds',
    roleLabel: 'Head Chef (Kitchen KDS)',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
  },
  owner: {
    id: 'usr_owner_01',
    name: 'Malik Hasan',
    email: 'owner@hasan.com',
    role: 'owner',
    roleLabel: 'Restaurant Owner & Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
};

export function getStoredAuthUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading auth from localStorage', err);
  }
  return null;
}

export function setStoredAuthUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error saving auth to localStorage', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = getStoredAuthUser();
    // Default to staff if none set for convenient first view, or null if explicit
    if (saved) {
      setUser(saved);
    } else {
      // Default to staff on first visit
      setUser(DEMO_ACCOUNTS.staff);
      setStoredAuthUser(DEMO_ACCOUNTS.staff);
    }
    setIsLoading(false);
  }, []);

  const login = (email: string): { success: boolean; role: UserRole } => {
    const clean = email.trim().toLowerCase();
    let target: UserProfile = DEMO_ACCOUNTS.staff;

    if (clean.includes('kds') || clean.includes('chef') || clean.includes('kitchen')) {
      target = DEMO_ACCOUNTS.kds;
    } else if (clean.includes('owner') || clean.includes('admin') || clean.includes('manager')) {
      target = DEMO_ACCOUNTS.owner;
    } else {
      target = {
        id: `usr_${Date.now()}`,
        name: clean.split('@')[0] || 'Staff Member',
        email: clean,
        role: 'staff',
        roleLabel: 'Staff Cashier',
      };
    }

    setUser(target);
    setStoredAuthUser(target);
    return { success: true, role: target.role };
  };

  const quickLogin = (role: UserRole) => {
    const target = DEMO_ACCOUNTS[role];
    setUser(target);
    setStoredAuthUser(target);
    return target;
  };

  const logout = () => {
    setUser(null);
    setStoredAuthUser(null);
  };

  return {
    user,
    isLoading,
    login,
    quickLogin,
    logout,
  };
}
