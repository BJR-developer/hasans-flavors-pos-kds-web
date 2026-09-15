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
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { isMobileOrder } from '@/lib/orderUtils';
import { useOrderNotifications } from '@/lib/orderNotifications';
import { ShareOrderModal } from '@/components/orders/ShareOrderModal';
import { Order } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const { user, initialize, signOut } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [shareOrder, setShareOrder] = useState<Order | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { isRead, markAsRead, markAllAsRead } = useOrderNotifications();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

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

  // Mobile customer orders within the last 24 hours (Delivery, Takeout, Mobile Dine-In)
  const recentMobileOrders = orders.filter(
    (o) =>
      isMobileOrder(o) &&
      o.status !== 'cancelled' &&
      o.status !== 'draft' &&
      new Date(o.createdAt).getTime() >= recent24hCutoff
  );

  // Unread mobile orders: only orders that have NOT been read/dismissed yet
  const unreadMobileOrders = recentMobileOrders.filter((o) => !isRead(o.id));
  const readMobileOrders = recentMobileOrders.filter((o) => isRead(o.id));
  const unreadCount = unreadMobileOrders.length;

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

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

        {/* Right Tools: Role Badge, Quick Role Switcher, Sign Out */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Notifications: Mobile Orders Only (Delivery, Takeout, Mobile Dine-In) */}
          {!isSignInPage && user && isCashier && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                title="Mobile Order Notifications (Delivery, Takeout, Dine-in)"
                className={`relative p-2 rounded-lg border transition-colors flex items-center justify-center ${
                  unreadCount > 0
                    ? 'border-red-300 bg-red-50 text-[#BA1A20] hover:bg-red-100 shadow-xs'
                    : 'border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]'
                }`}
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-[#BA1A20]' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#BA1A20] text-white text-[9.5px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Popover for Mobile Orders Notifications */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-84 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-neutral-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#BA1A20] flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold tracking-tight">Mobile Order Alerts</h4>
                        <p className="text-[10px] text-neutral-400">
                          {unreadCount > 0 ? `${unreadCount} unread incoming` : 'All caught up'}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          markAllAsRead(unreadMobileOrders.map((o) => o.id));
                        }}
                        className="text-[10.5px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        title="Mark all notifications as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-2">
                    {unreadMobileOrders.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-bold text-neutral-800">No Unread Mobile Orders</p>
                        <p className="text-[11px] text-neutral-400 leading-relaxed max-w-[240px] mx-auto">
                          When customers order from mobile (Delivery, Takeout, or Dine-In), you will be alerted here.
                        </p>
                      </div>
                    ) : (
                      unreadMobileOrders.map((order) => {
                        return (
                          <div
                            key={order.id}
                            className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                                  {order.orderNumber}
                                </span>
                                <span
                                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    order.type === 'delivery'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : order.type === 'takeout'
                                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}
                                >
                                  {order.type === 'delivery' ? (
                                    <>
                                      <Bike className="w-3 h-3" />
                                      <span>Delivery</span>
                                    </>
                                  ) : order.type === 'takeout' ? (
                                    <>
                                      <ShoppingBag className="w-3 h-3" />
                                      <span>Takeout</span>
                                    </>
                                  ) : (
                                    <>
                                      <UtensilsCrossed className="w-3 h-3" />
                                      <span>{order.tableNumber || 'Dine-In'}</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {formatTimeAgo(order.createdAt)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => markAsRead(order.id)}
                                  title="Mark as Read (dismiss)"
                                  className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors ml-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-baseline justify-between text-xs">
                              <div className="font-semibold text-neutral-800 truncate">
                                {order.customerName || 'Mobile Guest'}
                              </div>
                              <div className="font-bold text-[#BA1A20] font-mono">
                                ₱{order.total.toLocaleString()}
                              </div>
                            </div>

                            {/* Items count & preview */}
                            <div className="text-[11px] text-neutral-600 line-clamp-1">
                              <span className="font-medium text-neutral-700">
                                {order.items.reduce((s, i) => s + (i.quantity || 1), 0)} items:
                              </span>{' '}
                              {order.items.map((it) => `${it.dish?.name || 'Item'} ×${it.quantity}`).join(', ')}
                            </div>

                            {/* Special instructions if any */}
                            {order.specialNotes && (
                              <div className="p-1.5 rounded bg-white/80 border border-amber-200 text-[10.5px] text-amber-950 italic">
                                &ldquo;{order.specialNotes}&rdquo;
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  markAsRead(order.id);
                                  setIsNotifOpen(false);
                                  if (order.type === 'delivery') {
                                    router.push('/delivery');
                                  } else {
                                    router.push('/kds');
                                  }
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <span>View in {order.type === 'delivery' ? 'Delivery' : 'Kitchen (KDS)'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setShareOrder(order)}
                                title="Share address & order info to Messenger, Instagram, SMS..."
                                className="py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <Share2 className="w-3 h-3 text-[#BA1A20]" />
                                <span>Share</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => markAsRead(order.id)}
                                className="py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Done</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Past read orders toggle if user wants to see history */}
                    {readMobileOrders.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowHistory((v) => !v)}
                          className="w-full text-center py-1.5 text-[10.5px] font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
                        >
                          {showHistory
                            ? 'Hide dismissed orders'
                            : `View ${readMobileOrders.length} recently dismissed order${readMobileOrders.length > 1 ? 's' : ''}`}
                        </button>

                        {showHistory && (
                          <div className="space-y-1.5 pt-1.5">
                            {readMobileOrders.slice(0, 5).map((order) => (
                              <div
                                key={order.id}
                                className="p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-500 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-mono font-bold text-neutral-700">
                                    {order.orderNumber}
                                  </span>{' '}
                                  • {order.customerName} • ₱{order.total.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-neutral-400">
                                  {formatTimeAgo(order.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
