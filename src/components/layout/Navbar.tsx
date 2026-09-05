'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  ChefHat,
  TableProperties,
  Boxes,
  RotateCcw,
} from 'lucide-react';
import { useOrders, useResetStoreData } from '@/hooks/useRestaurantData';

export function Navbar() {
  const pathname = usePathname();
  const { data: orders = [] } = useOrders();
  const resetStore = useResetStoreData();

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
      label: 'Stock 86',
      icon: Boxes,
      badge: null,
    },
  ];

  return (
    <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/pos" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-lg bg-[#BA1A20] text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
              HF
            </span>
            <div>
              <span className="font-extrabold text-[#1F1F1F] text-sm tracking-tight group-hover:text-[#BA1A20] transition-colors">
                Hasan&apos;s Flavors
              </span>
              <span className="hidden sm:inline text-xs text-[#737373] ml-2 font-normal">
                POS &amp; Kitchen
              </span>
            </div>
          </Link>
        </div>

        {/* Center Primary Nav Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href === '/pos' && pathname === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1F1F1F] text-white'
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

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset store demo data?')) {
                resetStore.mutate();
              }
            }}
            title="Reset demo data"
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
