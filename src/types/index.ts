export interface Dish {
  id: string;
  name: string;
  slug: string;
  price: number;
  formattedPrice: string;
  category: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  spiceLevel: number; // 1 (Mild) to 4 (Fiery)
  isHalal: boolean;
  isChefSpecial: boolean;
  isPopular: boolean;
  inStock: boolean;
  preparationTime: string;
  calories: string;
  rating: string;
  reviewCount: number;
  station?: 'tandoor' | 'biryani_curry' | 'sides_drinks' | 'general';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  match?: string;
  imageUrl?: string;
}

export interface PortionOption {
  id: string;
  name: string;
  priceDelta: number;
  serves: string;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  dish: Dish;
  quantity: number;
  portion: PortionOption;
  spiceLevel: number;
  selectedAddons: AddonOption[];
  specialNotes?: string;
  unitPrice: number;
  totalPrice: number;
  station?: string;
  completedInKitchen?: boolean;
}

export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'gcash' | 'card';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceFee: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  estimatedMinutes: number;
  specialNotes?: string;
  cashTendered?: number;
  changeDue?: number;
}

export interface TableSession {
  tableNumber: string;
  guestCount: number;
  status: 'available' | 'occupied' | 'billing';
  activeOrderId?: string;
  joinedAt?: string;
}

export type UserRole = 'staff' | 'kds' | 'owner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarUrl?: string;
}

export interface DailyStats {
  todayRevenue: number;
  orderCount: number;
  activeTables: number;
  avgPrepTimeMinutes: number;
  topSellingItems: { name: string; sold: number; revenue: number }[];
}
