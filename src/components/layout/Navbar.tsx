'use client';

import React, { useEffect } from 'react';
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
  ShieldAlert,
  QrCode,
  Bike,
  Bell,
  MessageSquareText,
  Check,
  Phone,
  X,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const { user, initialize, signOut } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [readNoteIds, setReadNoteIds] = React.useState<string[]>([]);

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

  // Running deliveries count
  const runningDeliveriesCount = orders.filter(
    (o) => o.type === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  // Active customer special notes & instructions
  const activeNotes = orders.filter(
    (o) => o.specialNotes && o.specialNotes.trim() && o.status !== 'completed' && o.status !== 'cancelled'
  );
  const unreadNotes = activeNotes.filter((o) => !readNoteIds.includes(o.id));
  const unreadCount = unreadNotes.length;

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
          {/* Notifications / Diner Messages Bell */}
          {!isSignInPage && user && isCashier && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                title="Customer Special Instructions & Requests"
                className={`relative p-2 rounded-lg border transition-colors flex items-center justify-center ${
                  unreadCount > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BA1A20] text-white text-[9.5px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Popover for Diner Messages & Instructions */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4 text-[#BA1A20]" />
                      <span className="text-xs font-bold text-neutral-900">
                        Diner Messages ({activeNotes.length})
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setReadNoteIds(activeNotes.map((o) => o.id));
                        }}
                        className="text-[10.5px] font-bold text-[#BA1A20] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-1.5">
                    {activeNotes.length === 0 ? (
                      <div className="p-6 text-center text-neutral-400 text-xs">
                        No active customer requests or special notes.
                      </div>
                    ) : (
                      activeNotes.map((noteOrder) => {
                        const isRead = readNoteIds.includes(noteOrder.id);
                        return (
                          <div
                            key={noteOrder.id}
                            className={`p-2.5 rounded-lg border text-xs transition-colors ${
                              isRead
                                ? 'bg-white border-neutral-100 text-neutral-600'
                                : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono font-bold text-[11px] text-neutral-900">
                                {noteOrder.orderNumber} • {noteOrder.customerName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {noteOrder.customerPhone && (
                                  <a
                                    href={`tel:${noteOrder.customerPhone}`}
                                    className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded"
                                    title={`Call ${noteOrder.customerPhone}`}
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                )}
                                {!isRead && (
                                  <button
                                    type="button"
                                    onClick={() => setReadNoteIds((prev) => [...prev, noteOrder.id])}
                                    title="Mark as Read"
                                    className="p-0.5 rounded hover:bg-amber-200/60 text-amber-800"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11.5px] leading-relaxed text-neutral-800 italic">
                              "{noteOrder.specialNotes}"
                            </p>
                          </div>
                        );
                      })
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
    </header>
  );
}
