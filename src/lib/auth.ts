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
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

      if (!sessionErr && session?.user) {
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

        // Auth user exists without profile
        const meta = session.user.user_metadata || {};
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.full_name || session.user.email?.split('@')[0] || 'Staff Member',
            role: (meta.role as UserRole) || 'cashier',
            phone: meta.phone,
          },
          isLoading: false,
        });
        return;
      }

      // Strictly unauthenticated when no valid Supabase session exists
      set({
        user: null,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      set({ user: null, isLoading: false, error: err?.message || 'Initialization failed' });
    }
  },

  signInWithPassword: async (email: string, pass: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const role = (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'cashier';
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          role,
          phone: profile?.phone || data.user.user_metadata?.phone,
        };

        set({ user, isLoading: false, error: null });
        return { success: true, role };
      }

      set({ isLoading: false, error: 'User not found' });
      return { success: false, error: 'User not found' };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/signin` : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      set({ isLoading: false });
      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: `Password reset verification email sent to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to send reset email' });
      return { success: false, error: err?.message || 'Failed to send reset email' };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    set({ user: null, error: null });
  },
}));
