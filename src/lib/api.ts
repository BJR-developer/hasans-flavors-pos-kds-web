import { supabase } from './supabase';
import { Dish, Order, TableSession } from '@/types';

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
export const mapOrderFromDB = (row: any): Order => ({
  id: row.id,
  orderNumber: row.order_number,
  customerName: row.customer_name,
  customerPhone: row.customer_phone || undefined,
  tableNumber: row.table_number || undefined,
  type: row.type,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method,
  subtotal: Number(row.subtotal),
  tax: Number(row.tax),
  serviceFee: 0,
  deliveryFee: Number(row.delivery_fee || 0),
  discount: 0,
  total: Number(row.total),
  specialNotes: row.notes || undefined,
  items: Array.isArray(row.items) ? row.items : [],
  createdAt: row.created_at,
  estimatedMinutes: 20,
});

// Map database row to TableSession
export const mapTableFromDB = (row: any): TableSession => ({
  tableNumber: row.table_number,
  guestCount: row.guest_count || 4,
  status: row.status,
  activeOrderId: row.current_order_id || undefined,
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
    total: order.total,
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
  return mapOrderFromDB(data);
};

export const updateOrderStatusInDB = async (orderId: string, status: Order['status']): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;
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
