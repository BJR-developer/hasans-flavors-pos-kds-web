import { create } from 'zustand';
import { supabase } from './supabase';

export type UserRole = 'owner' | 'cashier' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signInWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.full_name || profile.email.split('@')[0],
              role: (profile.role as UserRole) || 'cashier',
              phone: profile.phone,
              avatarUrl: profile.avatar_url,
            },
            isLoading: false,
          });
          return;
        }
      }

      // Default initial session fallback: Cashier role
      const { data: cashierProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'cashier')
        .single();

      if (cashierProfile) {
        set({
          user: {
            id: cashierProfile.id,
            email: cashierProfile.email,
            name: cashierProfile.full_name,
            role: 'cashier',
            phone: cashierProfile.phone,
          },
          isLoading: false,
        });
      } else {
        set({
          user: {
            id: 'mock-cashier',
            email: 'cashier@hasan.com',
            name: 'Main POS Cashier',
            role: 'cashier',
          },
          isLoading: false,
        });
      }
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      set({ isLoading: false });
    }
  },

  signInWithPassword: async (email: string, pass: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const role = (profile?.role as UserRole) || 'customer';
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.full_name || email.split('@')[0],
          role,
          phone: profile?.phone,
        };

        set({ user, isLoading: false });
        return { success: true, role };
      }

      set({ isLoading: false });
      return { success: false, error: 'User not found' };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  quickSwitchRole: async (role: UserRole) => {
    set({ isLoading: true });
    try {
      const email = `${role}@hasan.com`;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profile) {
        set({
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            role: profile.role as UserRole,
            phone: profile.phone,
          },
          isLoading: false,
        });
      } else {
        set({
          user: {
            id: `role-${role}`,
            email,
            name: `${role.toUpperCase()} User`,
            role,
          },
          isLoading: false,
        });
      }
    } catch (e) {
      console.error('Quick switch error:', e);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
