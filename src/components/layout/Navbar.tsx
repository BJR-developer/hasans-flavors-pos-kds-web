'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  ChefHat,
  TableProperties,
  Boxes,
  BarChart3,
  LogOut,
  LogIn,
  ShieldAlert,
  QrCode,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const { user, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isSignInPage = pathname === '/signin';

  const kitchenQueueCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  // STRICT ROLE SEPARATION PER USER DIRECTIVE:
  // - Owner: Can ONLY access Owner Dashboard (/analytics) and Table Standees (/tables).
  // - Cashier: Manages POS (/pos), Kitchen (/kds), Orders (/orders), Stock (/inventory), Table Standees (/tables).
  // - Unauthenticated / Customer: Must NOT see any staff operations or links.
  const isOwner = user?.role === 'owner';
  const isCashier = user?.role === 'cashier';

  // Define navigation items based on role. Strictly staff/owner only.
  const navItems = isOwner
    ? [
        {
          href: '/analytics',
          label: 'Owner Dashboard',
          icon: BarChart3,
          badge: null,
        },
        {
          href: '/tables',
          label: 'Table Standees',
          icon: QrCode,
          badge: null,
        },
      ]
    : isCashier
    ? [
        {
          href: '/pos',
          label: 'Register (POS)',
          icon: UtensilsCrossed,
          badge: null,
        },
        {
          href: '/kds',
          label: 'Kitchen (KDS)',
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
          href: '/tables',
          label: 'Table Standees',
          icon: QrCode,
          badge: null,
        },
      ]
    : [];

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href={!user ? '/signin' : isOwner ? '/analytics' : '/pos'} className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="Hasan's Flavors Logo"
                fill
                sizes="36px"
                priority
                className="object-contain"
              />
            </div>
            <div className="hidden xs:block">
              <span className="font-extrabold text-[#1F1F1F] text-xs sm:text-sm tracking-tight group-hover:text-[#BA1A20] transition-colors block">
                Hasan&apos;s Flavors
              </span>
              <span className="text-[10px] text-[#737373] font-medium block leading-none">
                {!user ? 'Staff Portal • Please Sign In' : isOwner ? 'Owner Executive Portal' : 'POS & Kitchen Operations'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center Primary Nav Links */}
        {!isSignInPage && (
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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

        {/* Right Tools: Role Badge, Quick Role Switcher, Sign Out */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSignInPage && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Role Indicator Chip */}
              <div className="hidden md:flex flex-col text-right leading-none">
                <span className="text-xs font-bold text-[#1F1F1F]">{user.name}</span>
                <span
                  className={`text-[10px] font-extrabold mt-0.5 uppercase tracking-wider ${
                    user.role === 'owner'
                      ? 'text-[#B45309]'
                      : user.role === 'cashier'
                      ? 'text-[#BA1A20]'
                      : 'text-[#2E7D32]'
                  }`}
                >
                  {user.role}
                </span>
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
