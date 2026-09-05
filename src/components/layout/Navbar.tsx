'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  ChefHat,
  TableProperties,
  Boxes,
  BarChart3,
  Clock,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useOrders, useResetStoreData } from '@/hooks/useRestaurantData';

export function Navbar() {
  const pathname = usePathname();
  const { data: orders = [] } = useOrders();
  const resetStore = useResetStoreData();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length;

  const kitchenQueueCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const navItems = [
    {
      href: '/pos',
      label: 'POS Register',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      href: '/kds',
      label: 'Kitchen KDS',
      icon: ChefHat,
      badge: kitchenQueueCount > 0 ? kitchenQueueCount : null,
      badgeColor: 'bg-[#BA1A20] text-white',
    },
    {
      href: '/orders',
      label: 'Orders Table',
      icon: TableProperties,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-[#B45309] text-white',
    },
    {
      href: '/inventory',
      label: 'Menu & Stock 86',
      icon: Boxes,
      badge: null,
    },
    {
      href: '/analytics',
      label: 'Owner Overview',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <header className="bg-white border-b border-[#E9E8E7] sticky top-0 z-40 stitch-shadow">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Terminal Info */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BA1A20] to-[#8B0000] flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
            HF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#2D2926] text-base tracking-tight">
                HASAN&apos;S FLAVORS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                Zabihah Halal
              </span>
            </div>
            <p className="text-xs text-[#8F6F6C] font-medium">
              Operations Cockpit • Register #01 & Kitchen Display
            </p>
          </div>
        </div>

        {/* Center Primary Nav Links */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href === '/pos' && pathname === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FFF2F0] text-[#BA1A20] shadow-xs border border-[#FFDAD6]'
                    : 'text-[#5B403D] hover:bg-[#F4F3F2] hover:text-[#2D2926]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#BA1A20]' : 'text-[#8F6F6C]'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Clock, Sound Toggle, Reset Data */}
        <div className="flex items-center gap-2.5 min-w-max">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F4F3F2] border border-[#E9E8E7] px-3 py-1.5 rounded-xl text-xs font-medium text-[#5B403D]">
            <Clock className="w-3.5 h-3.5 text-[#8F6F6C]" />
            <span>{currentDate}</span>
            <span className="font-bold text-[#2D2926]">{currentTime}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Kitchen Sound Alerts On' : 'Kitchen Sound Alerts Muted'}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-[#FFF8E1] border-[#B45309]/30 text-[#B45309]'
                : 'bg-[#F4F3F2] border-[#E9E8E7] text-[#8F6F6C]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset store demo orders and dish inventory stock back to initial data?')) {
                resetStore.mutate();
              }
            }}
            title="Reset Mock Demo Data"
            className="p-2 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] text-[#8F6F6C] hover:text-[#2D2926] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
