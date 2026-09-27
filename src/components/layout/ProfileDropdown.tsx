'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!user) return null;

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/signin');
  };

  // Get initials for profile picture
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const isSettingsActive = pathname.startsWith('/settings');
  const isShiftsActive = pathname.startsWith('/shifts');

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Profile Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`${user.name} (${user.role}) • Account options`}
        className={`flex items-center gap-1.5 p-1 sm:pl-1 sm:pr-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-neutral-100 border-neutral-400 shadow-xs'
            : isSettingsActive || isShiftsActive
            ? 'border-neutral-900 bg-neutral-50 shadow-xs'
            : 'border-line bg-white hover:bg-neutral-50 hover:border-neutral-300'
        }`}
      >
        {/* Avatar Circle / Picture */}
        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 relative">
          {initials}
          {/* Active status indicator dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        {/* Small Chevron Down Indicator */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 overflow-hidden"
          >
            {/* Header: User Profile Information */}
            <div className="p-3.5 bg-neutral-50 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 truncate block">
                      {user.name}
                    </span>
                    <span
                      className={`text-xs font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        user.role === 'owner'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : user.role === 'cashier'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 truncate block font-mono mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              {/* My Shift (cashiers; owners have Cash & Shifts in the main menu) */}
              {user.role === 'cashier' && (
              <Link
                href="/shifts"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isShiftsActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${
                    isShiftsActive ? 'text-white' : 'text-brand'
                  }`}
                />
                <div className="flex-1">
                  <span className="block leading-tight">
                    My Shift
                  </span>
                  <span
                    className={`text-xs block ${
                      isShiftsActive ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    Drawer cash, payments, close shift
                  </span>
                </div>
              </Link>
              )}

              {/* Settings Link */}
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isSettingsActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <SlidersHorizontal
                  className={`w-4 h-4 ${
                    isSettingsActive ? 'text-white' : 'text-brand'
                  }`}
                />
                <div className="flex-1">
                  <span className="block leading-tight">Settings</span>
                  <span
                    className={`text-xs block ${
                      isSettingsActive ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    Account profile &amp; POS rules
                  </span>
                </div>
              </Link>
            </div>

            {/* Divider & Sign Out */}
            <div className="p-1.5 border-t border-neutral-100 bg-neutral-50/50">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
