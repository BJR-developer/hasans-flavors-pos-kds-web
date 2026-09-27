'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, ChefHat, History, Boxes, BarChart3, LogIn, QrCode, Bike, Wallet, Users } from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { useNow } from '@/hooks/useNow';
import { ShareOrderModal } from '@/components/orders/ShareOrderModal';
import { ProfileDropdown } from './ProfileDropdown';
import { OrderNotificationDropdown } from './OrderNotificationDropdown';
import { ShiftPill } from './ShiftPill';
import { Order } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const { data: orders = [] } = useOrders();
  const { user, initialize } = useAuthStore();
  const [shareOrder, setShareOrder] = useState<Order | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isSignInPage = pathname === '/signin';
  const authLoading = useAuthStore((st) => st.isLoading);

  // Scope active counts strictly to last 24 hours (matching KdsBoard logic)
  const now = useNow();
  const recent24hCutoff = now - 24 * 60 * 60 * 1000;

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

  const isOwner = user?.role === 'owner';
  const isCashier = user?.role === 'cashier';
  const isStaff = isOwner || isCashier;

  const kitchenBadge = kitchenQueueCount > 0 ? kitchenQueueCount : null;
  const deliveryBadge = runningDeliveriesCount > 0 ? runningDeliveriesCount : null;

  // Owner manages everything; cashiers run the till. Settings live in the profile menu.
  const navItems = isOwner
    ? [
        { href: '/analytics', label: 'Dashboard', icon: BarChart3, badge: null },
        { href: '/shifts', label: 'Cash & Shifts', icon: Wallet, badge: null },
        { href: '/orders', label: 'Orders', icon: History, badge: null },
        { href: '/kds', label: 'Kitchen', icon: ChefHat, badge: kitchenBadge },
        { href: '/delivery', label: 'Delivery', icon: Bike, badge: deliveryBadge },
        { href: '/inventory', label: 'Menu & Stock', icon: Boxes, badge: null },
        { href: '/tables', label: 'Tables', icon: QrCode, badge: null },
        { href: '/staff', label: 'Staff', icon: Users, badge: null },
      ]
    : isCashier
    ? [
        { href: '/pos', label: 'Register', icon: UtensilsCrossed, badge: null },
        { href: '/kds', label: 'Kitchen', icon: ChefHat, badge: kitchenBadge },
        { href: '/delivery', label: 'Delivery', icon: Bike, badge: deliveryBadge },
        { href: '/orders', label: 'Orders', icon: History, badge: null },
        { href: '/inventory', label: 'Menu & Stock', icon: Boxes, badge: null },
        { href: '/tables', label: 'Tables', icon: QrCode, badge: null },
      ]
    : [];

  return (
    <header className="bg-white border-b border-line sticky top-0 z-40">
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
              <span className="font-extrabold text-ink text-xs sm:text-sm tracking-tight group-hover:text-brand transition-colors block">
                Hasan&apos;s Flavors
              </span>
              <span className="text-xs text-muted font-medium block leading-none">
                {!user ? 'Staff Portal' : isOwner ? 'Owner' : 'Cashier'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center Primary Nav Links */}
        {!isSignInPage && (
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-soft hover:bg-[#F5F5F5] hover:text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className={isOwner ? 'hidden xl:inline' : 'hidden lg:inline'}>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-xs font-bold px-1.5 rounded-full ${
                        isActive ? 'bg-white text-ink' : 'bg-brand text-white'
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

        {/* Right tools: shift pill (cashier), mobile-order bell, profile */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {!isSignInPage && isCashier && <ShiftPill />}

          {!isSignInPage && isStaff && (
            <OrderNotificationDropdown orders={orders} onShareOrder={setShareOrder} />
          )}

          {!isSignInPage && user ? (
            <ProfileDropdown />
          ) : !isSignInPage && !authLoading ? (
            <Link
              href="/signin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
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
