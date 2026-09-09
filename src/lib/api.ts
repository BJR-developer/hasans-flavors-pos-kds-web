import { supabase } from './supabase';
import { Dish, Order, TableSession, Category, AddonOption } from '@/types';

// Map database snake_case row to TypeScript Dish
export const mapDishFromDB = (row: any): Dish => ({
  id: String(row.id),
  name: row.name,
  slug: row.slug,
  price: Number(row.price),
  formattedPrice: row.formatted_price || `₱${Number(row.price).toLocaleString()}`,
  category: row.category_name,
  description: row.description || '',
  imageUrl: row.image_url || '',
  imageUrls: Array.isArray(row.image_urls) && row.image_urls.length > 0
    ? row.image_urls
    : (row.image_url ? [row.image_url] : []),
  spiceLevel: Number(row.spice_level || 0),
  variants: Array.isArray(row.variants) ? row.variants : [],
  isHalal: row.is_halal ?? true,
  isChefSpecial: row.is_chef_special ?? false,
  isPopular: row.is_popular ?? false,
  inStock: row.in_stock ?? true,
  preparationTime: row.preparation_time || '15-20 mins',
  calories: row.calories || '',
  rating: String(row.rating || '4.8'),
  reviewCount: Number(row.review_count || 10),
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

// Map database snake_case row to TypeScript Order
export const mapOrderFromDB = (row: any): Order => {
  const subtotal = Number(row.subtotal || 0);
  const tax = Number(row.tax || 0);
  const deliveryFee = Number(row.delivery_fee || 0);
  const discount = Number(row.discount || 0);
  const total = Number(row.total || 0);
  const amountPaid = Number(
    row.amount_paid !== undefined && row.amount_paid !== null
      ? row.amount_paid
      : row.payment_status === 'paid'
      ? total
      : 0
  );
  const balanceDue = Math.max(0, total - amountPaid);

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    tableNumber: row.table_number || undefined,
    type: row.type,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    subtotal,
    tax,
    serviceFee: 0,
    deliveryFee,
    discount,
    total,
    amountPaid,
    balanceDue,
    paymentHistory: Array.isArray(row.payment_history) ? row.payment_history : [],
    specialNotes: row.notes || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: row.created_at,
    estimatedMinutes: 20,
  };
};

// Map database row to TableSession
export const mapTableFromDB = (row: any): TableSession => ({
  id: row.id,
  tableNumber: row.table_number,
  capacity: Number(row.capacity || row.guest_count || 4),
  guestCount: Number(row.guest_count || row.capacity || 4),
  status: row.status,
  activeOrderId: row.current_order_id || undefined,
  joinedAt: row.created_at,
  updatedAt: row.updated_at,
});

// 1. DISHES API
export const fetchDishesFromDB = async (): Promise<Dish[]> => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('name');
  if (error) {
    console.error('Error fetching dishes from DB:', error);
    throw error;
  }
  return (data || []).map(mapDishFromDB);
};

export const updateDishInDB = async (id: string, updates: Partial<Dish>): Promise<Dish> => {
  const dbPayload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.price !== undefined) {
    dbPayload.price = updates.price;
    dbPayload.formatted_price = `₱${updates.price.toLocaleString()}`;
  }
  if (updates.category !== undefined) dbPayload.category_name = updates.category;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
  if (updates.imageUrls !== undefined) {
    dbPayload.image_urls = updates.imageUrls;
    if (updates.imageUrls.length > 0 && !updates.imageUrl) {
      dbPayload.image_url = updates.imageUrls[0];
    }
  }
  if (updates.inStock !== undefined) dbPayload.in_stock = updates.inStock;
  if (updates.isChefSpecial !== undefined) dbPayload.is_chef_special = updates.isChefSpecial;
  if (updates.isPopular !== undefined) dbPayload.is_popular = updates.isPopular;
  if (updates.spiceLevel !== undefined) dbPayload.spice_level = updates.spiceLevel;
  if (updates.variants !== undefined) dbPayload.variants = updates.variants;

  const { data, error } = await supabase
    .from('dishes')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDishFromDB(data);
};

export const createDishInDB = async (dish: Omit<Dish, 'id'>): Promise<Dish> => {
  const id = `dish_${Date.now()}`;
  const slug = dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dbPayload = {
    id,
    name: dish.name,
    slug,
    price: dish.price,
    formatted_price: `₱${dish.price.toLocaleString()}`,
    category_name: dish.category,
    description: dish.description || '',
    image_url: dish.imageUrl || (dish.imageUrls && dish.imageUrls[0]) || '',
    image_urls: dish.imageUrls && dish.imageUrls.length > 0 
      ? dish.imageUrls 
      : (dish.imageUrl ? [dish.imageUrl] : []),
    spice_level: dish.spiceLevel || 0,
    variants: dish.variants || [],
    is_halal: dish.isHalal ?? true,
    is_chef_special: dish.isChefSpecial ?? false,
    is_popular: dish.isPopular ?? false,
    in_stock: dish.inStock ?? true,
    preparation_time: dish.preparationTime || '15-20 mins',
    calories: dish.calories || '',
    rating: parseFloat(dish.rating) || 5.0,
    review_count: dish.reviewCount || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('dishes')
    .insert(dbPayload)
    .select()
    .single();

  if (error) throw error;
  return mapDishFromDB(data);
};

export const deleteDishFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  if (error) throw error;
};

export const deleteDishesFromDB = async (ids: string[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  const { error } = await supabase.from('dishes').delete().in('id', ids);
  if (error) throw error;
};

export const updateDishesStockInDB = async (ids: string[], inStock: boolean): Promise<void> => {
  if (!ids || ids.length === 0) return;
  const { error } = await supabase
    .from('dishes')
    .update({ in_stock: inStock, updated_at: new Date().toISOString() })
    .in('id', ids);
  if (error) throw error;
};

// CATEGORIES API
export const createCategoryInDB = async ({
  name,
  imageUrl,
  icon = 'restaurant-outline',
}: {
  name: string;
  imageUrl?: string;
  icon?: string;
}): Promise<Category> => {
  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const { data: existing } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const dbPayload = {
    id,
    name: cleanName,
    slug,
    icon,
    image_url:
      imageUrl ||
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
    sort_order: nextSort,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating category in DB:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon || 'restaurant',
    count: 0,
    imageUrl: data.image_url,
  };
};

export const updateCategoryInDB = async (
  id: string,
  updates: { name?: string; imageUrl?: string; icon?: string }
): Promise<Category> => {
  const dbPayload: any = {};
  if (updates.name !== undefined) {
    dbPayload.name = updates.name.trim();
    dbPayload.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (updates.imageUrl !== undefined) {
    dbPayload.image_url = updates.imageUrl;
  }
  if (updates.icon !== undefined) {
    dbPayload.icon = updates.icon;
  }

  const { data, error } = await supabase
    .from('categories')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category in DB:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon || 'restaurant',
    count: 0,
    imageUrl: data.image_url,
  };
};

export const deleteCategoryInDB = async (id: string, name: string): Promise<void> => {
  if (id === 'all') {
    throw new Error('Cannot delete the primary All Dishes category.');
  }

  // Check if any dishes currently use this category
  const { data: activeDishes } = await supabase
    .from('dishes')
    .select('id')
    .eq('category_name', name);

  if (activeDishes && activeDishes.length > 0) {
    throw new Error(
      `Cannot delete "${name}" because ${activeDishes.length} dish(es) are assigned to it. Reassign or delete those dishes first.`
    );
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category in DB:', error);
    throw error;
  }
};

// 2. ORDERS API
export const fetchOrdersFromDB = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders from DB:', error);
    throw error;
  }
  return (data || []).map(mapOrderFromDB);
};

export const createOrderInDB = async (order: Order): Promise<Order> => {
  const amountPaid =
    order.amountPaid !== undefined
      ? order.amountPaid
      : order.paymentStatus === 'paid'
      ? order.total
      : 0;

  const dbPayload = {
    id: order.id,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone || null,
    table_number: order.tableNumber || null,
    type: order.type,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    subtotal: order.subtotal,
    tax: order.tax,
    delivery_fee: order.deliveryFee || 0,
    discount: order.discount || 0,
    total: order.total,
    amount_paid: amountPaid,
    payment_history: order.paymentHistory || (amountPaid > 0 ? [
      {
        id: `pay_${Date.now()}`,
        amount: amountPaid,
        method: order.paymentMethod,
        timestamp: new Date().toISOString(),
        note: 'Initial payment',
      }
    ] : []),
    notes: order.specialNotes || null,
    items: order.items,
    created_at: order.createdAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(dbPayload)
    .select()
    .single();

  if (error) throw error;

  // If dine-in order, automatically occupy the dining table
  if (order.type === 'dine_in' && order.tableNumber) {
    await updateTableStatusInDB(order.tableNumber, 'occupied', order.id).catch((err) =>
      console.warn('Failed to update table status on order creation:', err)
    );
  }

  return mapOrderFromDB(data);
};

export const updateOrderStatusInDB = async (
  orderId: string,
  status: Order['status'],
  tableNumber?: string
): Promise<void> => {
  const updatePayload: any = { status, updated_at: new Date().toISOString() };

  // When an order is completed, mark it paid in full and settle payment so revenue reflects on dashboard
  if (status === 'completed') {
    try {
      const { data: ord } = await supabase
        .from('orders')
        .select('total, amount_paid, payment_status, payment_method, payment_history')
        .eq('id', orderId)
        .single();

      if (ord) {
        const orderTotal = Number(ord.total || 0);
        updatePayload.payment_status = 'paid';
        updatePayload.amount_paid = orderTotal;

        const history = Array.isArray(ord.payment_history) ? [...ord.payment_history] : [];
        if (history.length === 0 || ord.payment_status !== 'paid') {
          history.push({
            id: `pay_${Date.now()}`,
            amount: orderTotal,
            method: ord.payment_method || 'cash',
            timestamp: new Date().toISOString(),
            note: 'Settled upon order completion',
          });
        }
        updatePayload.payment_history = history;
      }
    } catch (err) {
      console.warn('Error querying order details for completion payment settlement:', err);
    }
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId);

  if (error) throw error;

  // If order is completed or cancelled, release dining table immediately
  if (status === 'completed' || status === 'cancelled') {
    try {
      const { data: ord } = await supabase
        .from('orders')
        .select('table_number, type')
        .eq('id', orderId)
        .single();

      const tbl = tableNumber || ord?.table_number;
      if (tbl && (ord?.type === 'dine_in' || tableNumber)) {
        await updateTableStatusInDB(tbl, 'available', undefined);
      }
    } catch (e) {
      console.warn('Error releasing table on order status update:', e);
    }
  }
};

export const updateOrderPaymentInDB = async (
  orderId: string,
  updates: {
    paymentStatus: Order['paymentStatus'];
    paymentMethod?: Order['paymentMethod'];
    amountPaid?: number;
    paymentHistory?: any[];
    closeOrder?: boolean;
  }
): Promise<void> => {
  const dbUpdates: any = {
    payment_status: updates.paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
  if (updates.amountPaid !== undefined) dbUpdates.amount_paid = updates.amountPaid;
  if (updates.paymentHistory !== undefined) dbUpdates.payment_history = updates.paymentHistory;
  if (updates.closeOrder) dbUpdates.status = 'completed';

  const { data, error } = await supabase
    .from('orders')
    .update(dbUpdates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // If paid in full and completed, free table
  if (data && data.type === 'dine_in' && data.table_number) {
    if (data.payment_status === 'paid' && (data.status === 'completed' || updates.closeOrder)) {
      await updateTableStatusInDB(data.table_number, 'available', undefined).catch(console.warn);
    } else if (data.payment_status === 'paid') {
      // Still at table but bill paid
      await updateTableStatusInDB(data.table_number, 'billing', data.id).catch(console.warn);
    }
  }
};

export const addItemsToOrderInDB = async (
  orderId: string,
  additionalItems: any[]
): Promise<Order> => {
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !existing) throw fetchError || new Error('Order not found');

  const currentItems = Array.isArray(existing.items) ? existing.items : [];
  const mergedItems = [...currentItems, ...additionalItems];

  const subtotal = mergedItems.reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || 0), 0);
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = Number(existing.delivery_fee || 0);
  const discount = Number(existing.discount || 0);
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);
  const amountPaid = Number(existing.amount_paid || 0);

  // If new total exceeds amountPaid, it becomes unpaid or partially_paid
  let paymentStatus = existing.payment_status;
  if (amountPaid >= total && total > 0) {
    paymentStatus = 'paid';
  } else if (amountPaid > 0 && amountPaid < total) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      items: mergedItems,
      subtotal,
      tax,
      total,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return mapOrderFromDB(data);
};

export const updateOrderItemsInDB = async (
  orderId: string,
  items: any[]
): Promise<Order> => {
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !existing) throw fetchError || new Error('Order not found');

  const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || 0), 0);
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = Number(existing.delivery_fee || 0);
  const discount = Number(existing.discount || 0);
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);
  const amountPaid = Number(existing.amount_paid || 0);
  const balanceDue = Math.max(0, total - amountPaid);

  let paymentStatus = existing.payment_status;
  if (amountPaid >= total && total > 0) {
    paymentStatus = 'paid';
  } else if (amountPaid > 0 && amountPaid < total) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      items,
      subtotal,
      tax,
      total,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return mapOrderFromDB(data);
};

export const applyDiscountToOrderInDB = async (
  orderId: string,
  discount: number
): Promise<Order> => {
  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !existing) throw fetchError || new Error('Order not found');

  const subtotal = Number(existing.subtotal || 0);
  const tax = Number(existing.tax || 0);
  const deliveryFee = Number(existing.delivery_fee || 0);
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);
  const amountPaid = Number(existing.amount_paid || 0);

  let paymentStatus = existing.payment_status;
  if (amountPaid >= total && total > 0) {
    paymentStatus = 'paid';
  } else if (amountPaid > 0 && amountPaid < total) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      discount,
      total,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return mapOrderFromDB(data);
};

// 3. TABLES API
export const fetchTablesFromDB = async (): Promise<TableSession[]> => {
  const { data, error } = await supabase
    .from('dining_tables')
    .select('*');

  if (error) {
    console.error('Error fetching tables from DB:', error);
    throw error;
  }
  return (data || []).map(mapTableFromDB).sort((a, b) => {
    const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
};

export const updateTableStatusInDB = async (
  tableNumber: string,
  status: TableSession['status'],
  orderId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('dining_tables')
    .update({
      status,
      current_order_id: orderId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('table_number', tableNumber);

  if (error) throw error;
};

export const transferOrderTableInDB = async (
  orderId: string,
  fromTable: string | undefined,
  toTable: string
): Promise<Order> => {
  // 1. Update the order with the new table number
  const { data: updatedOrderData, error: orderError } = await supabase
    .from('orders')
    .update({
      table_number: toTable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) {
    console.error('Error updating order table in DB:', orderError);
    throw orderError;
  }

  // 2. Mark the new destination table as occupied
  await updateTableStatusInDB(toTable, 'occupied', orderId).catch((err) => {
    console.warn('Failed to update destination table status:', err);
  });

  // 3. If moving from a previous table, check if any other active order is still using it
  if (fromTable && fromTable !== toTable) {
    try {
      const { data: activeOrdersOnOldTable } = await supabase
        .from('orders')
        .select('id')
        .eq('table_number', fromTable)
        .neq('id', orderId)
        .in('status', ['pending', 'sent_to_kitchen', 'preparing', 'ready', 'served']);

      if (!activeOrdersOnOldTable || activeOrdersOnOldTable.length === 0) {
        await updateTableStatusInDB(fromTable, 'available', undefined);
      }
    } catch (err) {
      console.warn('Failed to free previous table status:', err);
    }
  }

  return mapOrderFromDB(updatedOrderData);
};

export const createTableInDB = async ({
  tableNumber,
  capacity = 4,
}: {
  tableNumber: string;
  capacity?: number;
}): Promise<TableSession> => {
  const cleanName = tableNumber.trim();
  const id = `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cap = Number(capacity) || 4;

  const { data, error } = await supabase
    .from('dining_tables')
    .insert({
      id,
      table_number: cleanName,
      capacity: cap,
      guest_count: cap,
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating table in DB:', error);
    throw error;
  }
  return mapTableFromDB(data);
};

export const updateTableInDB = async (
  id: string,
  updates: { tableNumber?: string; capacity?: number }
): Promise<TableSession> => {
  const dbPayload: any = { updated_at: new Date().toISOString() };
  if (updates.tableNumber !== undefined) {
    dbPayload.table_number = updates.tableNumber.trim();
  }
  if (updates.capacity !== undefined) {
    const cap = Number(updates.capacity) || 4;
    dbPayload.capacity = cap;
    dbPayload.guest_count = cap;
  }

  const { data, error } = await supabase
    .from('dining_tables')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating table in DB:', error);
    throw error;
  }
  return mapTableFromDB(data);
};

export const deleteTableFromDB = async (id: string, tableNumber: string): Promise<void> => {
  // Check if active orders exist on this table
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_number', tableNumber)
    .in('status', ['pending', 'sent_to_kitchen', 'preparing', 'ready', 'served']);

  if (activeOrders && activeOrders.length > 0) {
    throw new Error(`Cannot delete ${tableNumber} because it currently has active open orders.`);
  }

  const { error } = await supabase
    .from('dining_tables')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting table from DB:', error);
    throw error;
  }
};

export const releaseTableInDB = async (tableNumber: string): Promise<void> => {
  await updateTableStatusInDB(tableNumber, 'available', undefined);
};

// 4. ADD-ONS API
export const mapAddonFromDB = (row: any): AddonOption => ({
  id: row.id,
  name: row.name,
  price: Number(row.price || 0),
  imageUrl: row.image_url || undefined,
  inStock: row.in_stock ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const fetchAddonsFromDB = async (): Promise<AddonOption[]> => {
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching addons from DB:', error);
    throw error;
  }
  return (data || []).map(mapAddonFromDB);
};

export const createAddonInDB = async ({
  name,
  price,
  imageUrl,
  inStock = true,
}: {
  name: string;
  price: number;
  imageUrl?: string;
  inStock?: boolean;
}): Promise<AddonOption> => {
  const id = `addon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanName = name.trim();

  const { data, error } = await supabase
    .from('addons')
    .insert({
      id,
      name: cleanName,
      price: Number(price) || 0,
      image_url: imageUrl || null,
      in_stock: inStock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating addon in DB:', error);
    throw error;
  }
  return mapAddonFromDB(data);
};

export const updateAddonInDB = async (
  id: string,
  updates: { name?: string; price?: number; imageUrl?: string; inStock?: boolean }
): Promise<AddonOption> => {
  const dbPayload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbPayload.name = updates.name.trim();
  if (updates.price !== undefined) dbPayload.price = Number(updates.price) || 0;
  if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
  if (updates.inStock !== undefined) dbPayload.in_stock = updates.inStock;

  const { data, error } = await supabase
    .from('addons')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating addon in DB:', error);
    throw error;
  }
  return mapAddonFromDB(data);
};

export const deleteAddonInDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('addons').delete().eq('id', id);
  if (error) {
    console.error('Error deleting addon in DB:', error);
    throw error;
  }
};

export const toggleAddonStockInDB = async (id: string, inStock: boolean): Promise<void> => {
  const { error } = await supabase
    .from('addons')
    .update({ in_stock: inStock, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error toggling addon stock in DB:', error);
    throw error;
  }
};


