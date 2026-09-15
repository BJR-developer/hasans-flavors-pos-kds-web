'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hasan_read_notifications_v1';
const EVENT_NAME = 'hasan_notifs_changed';

export function getReadNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read notification IDs from localStorage:', err);
    return [];
  }
}

export function markNotificationAsRead(orderId: string): void {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const current = getReadNotificationIds();
    if (!current.includes(orderId)) {
      const updated = [...current, orderId];
      // Keep storage bounded to latest 500 IDs
      const trimmed = updated.slice(-500);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { orderId } }));
    }
  } catch (err) {
    console.warn('Failed to save read notification ID to localStorage:', err);
  }
}

export function markAllNotificationsAsRead(orderIds: string[]): void {
  if (typeof window === 'undefined' || !orderIds || orderIds.length === 0) return;
  try {
    const current = getReadNotificationIds();
    const set = new Set([...current, ...orderIds]);
    const trimmed = Array.from(set).slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { orderIds } }));
  } catch (err) {
    console.warn('Failed to mark all notifications as read in localStorage:', err);
  }
}

export function isNotificationRead(orderId: string): boolean {
  return getReadNotificationIds().includes(orderId);
}

export function useOrderNotifications() {
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    setReadIds(getReadNotificationIds());

    const handleChange = () => {
      setReadIds(getReadNotificationIds());
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const markAsRead = useCallback((orderId: string) => {
    markNotificationAsRead(orderId);
  }, []);

  const markAllAsRead = useCallback((orderIds: string[]) => {
    markAllNotificationsAsRead(orderIds);
  }, []);

  const isRead = useCallback(
    (orderId: string) => {
      return readIds.includes(orderId);
    },
    [readIds]
  );

  return {
    readIds,
    isRead,
    markAsRead,
    markAllAsRead,
  };
}
