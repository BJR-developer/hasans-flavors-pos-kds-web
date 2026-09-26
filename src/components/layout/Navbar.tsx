'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  ChefHat,
  History,
  Boxes,
  BarChart3,
  LogOut,
  LogIn,
  QrCode,
  Bike,
  Bell,
  Check,
  CheckCheck,
  Phone,
  Smartphone,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Share2,
  Clock,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { isMobileOrder } from '@/lib/orderUtils';
import { ShareOrderModal } from '@/components/orders/ShareOrderModal';
import { ProfileDropdown } from './ProfileDropdown';
import { OrderNotificationDropdown } from './OrderNotificationDropdown';
import { Order } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const { user, initialize, signOut } = useAuthStore();
  const [shareOrder, setShareOrder] = useState<Order | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isSignInPage = pathname === '/signin';

  // Scope active counts strictly to last 24 hours (matching KdsBoard logic)
  const recent24hCutoff = Date.now() - 24 * 60 * 60 * 1000;

  const kitchenQueueCount = orders.filter(
    (o) =>
      (o.status === 'pending' || o.status === 'preparing' || o.status === 'sent_to_kitchen') &&
      new Date(o.createdAt).getTime() >= recent24hCutoff
  ).length;

  // Running deliveries count
  const runningDeliveriesCount = orders.filter(
    (o) =>
      o.type === 'delivery' &&
      o.status !== 'completed' &&
      o.status !== 'cancelled' &&
      o.status !== 'draft' &&
      new Date(o.createdAt).getTime() >= recent24hCutoff
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
          label: 'Tables & Floor',
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
          href: '/delivery',
          label: 'Delivery',
          icon: Bike,
          badge: runningDeliveriesCount > 0 ? runningDeliveriesCount : null,
        },
        {
          href: '/orders',
          label: 'Order History',
          icon: History,
          badge: null,
        },
        {
          href: '/inventory',
          label: 'Menu & Stock',
          icon: Boxes,
          badge: null,
        },
        {
          href: '/tables',
          label: 'Tables & Floor',
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

        {/* Right Tools: Mobile Notifications Bell + Profile Dropdown */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Notifications: Mobile Orders Only (Delivery, Takeout, Mobile Dine-In) */}
          {!isSignInPage && user && isCashier && (
            <OrderNotificationDropdown orders={orders} onShareOrder={setShareOrder} />
          )}

          {!isSignInPage && user ? (
            <ProfileDropdown />
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

      {/* Share Order & Address Modal */}
      {shareOrder && (
        <ShareOrderModal
          isOpen={!!shareOrder}
          onClose={() => setShareOrder(null)}
          order={shareOrder}
        />
      )}
    </header>
  );
}
