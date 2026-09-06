'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_KEYS } from '@/hooks/useRestaurantData';

function RealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Orders realtime subscription (single global channel)
    const ordersChannel = supabase
      .channel('web:global:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
      })
      .subscribe();

    // 2. Dishes realtime subscription (single global channel)
    const dishesChannel = supabase
      .channel('web:global:dishes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
      })
      .subscribe();

    // 3. Dining tables realtime subscription (single global channel)
    const tablesChannel = supabase
      .channel('web:global:dining_tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dining_tables' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, [queryClient]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 5, // 5 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSubscriptions />
      {children}
    </QueryClientProvider>
  );
}
