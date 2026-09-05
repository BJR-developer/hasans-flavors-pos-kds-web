'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  ChefHat,
  TableProperties,
  Boxes,
  BarChart3,
  RotateCcw,
  LogOut,
  LogIn,
  User,
} from 'lucide-react';
import { useOrders, useResetStoreData } from '@/hooks/useRestaurantData';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const resetStore = useResetStoreData();
  const { user, logout } = useAuth();

  const isSignInPage = pathname === '/signin';

  const kitchenQueueCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const navItems = [
    {
      href: '/pos',
      label: 'Register',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      href: '/kds',
      label: 'Kitchen',
      icon: ChefHat,
      badge: kitchenQueueCount > 0 ? kitchenQueueCount : null,
    },
    {
      href: '/orders',
      label: 'Orders',
      icon: TableProperties,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      href: '/inventory',
      label: 'Menu & Stock',
      icon: Boxes,
      badge: null,
    },
    {
      href: '/analytics',
      label: 'Owner',
      icon: BarChart3,
      badge: null,
    },
  ];

  const handleSignOut = () => {
    logout();
    router.push('/signin');
  };

  return (
    <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/pos" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-[#BA1A20] text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs">
              HF
            </span>
            <div className="hidden xs:block">
              <span className="font-bold text-[#1F1F1F] text-xs sm:text-sm tracking-tight group-hover:text-[#BA1A20] transition-colors">
                Hasan&apos;s Flavors
              </span>
            </div>
          </Link>
        </div>

        {/* Center Primary Nav Links */}
        {!isSignInPage && (
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href === '/pos' && pathname === '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#1F1F1F] text-white shadow-xs'
                      : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-[#1F1F1F]' : 'bg-[#BA1A20] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Tools: User Profile / Sign In / Out */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSignInPage && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex flex-col text-right leading-none">
                <span className="text-xs font-bold text-[#1F1F1F]">{user.name}</span>
                <span className="text-[10px] text-[#737373] mt-0.5">{user.roleLabel}</span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FFF2F0] hover:border-[#FFDAD6] text-[#737373] hover:text-[#BA1A20] transition-colors text-xs font-medium flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-semibold">Sign Out</span>
              </button>
            </div>
          ) : !isSignInPage ? (
            <Link
              href="/signin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BA1A20] text-white text-xs font-bold hover:bg-[#8B0000] transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
