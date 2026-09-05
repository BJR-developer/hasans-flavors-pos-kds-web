import { Order, CartItem, Dish } from '@/types';
import menuData from '@/data/menu.json';
import { PORTION_OPTIONS, ADDON_OPTIONS } from '@/data/options';

const dishes = menuData as Dish[];
const getDish = (id: string) => dishes.find((d) => d.id === id) || dishes[0];

const createItem = (
  dishId: string,
  qty: number,
  portionIndex = 0,
  spiceLevel = 2,
  addonIndices: number[] = [],
  notes?: string
): CartItem => {
  const dish = getDish(dishId);
  const portion = PORTION_OPTIONS[portionIndex] || PORTION_OPTIONS[0];
  const selectedAddons = addonIndices.map((i) => ADDON_OPTIONS[i]).filter(Boolean);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = dish.price + portion.priceDelta + addonsTotal;
  const totalPrice = unitPrice * qty;

  let station = 'general';
  const cat = (dish.category || '').toLowerCase();
  const name = (dish.name || '').toLowerCase();
  if (cat.includes('biryani') || cat.includes('rice') || cat.includes('curry') || name.includes('haleem')) {
    station = 'biryani_curry';
  } else if (cat.includes('bbq') || name.includes('kabab') || name.includes('paratha') || name.includes('roll')) {
    station = 'tandoor';
  } else if (cat.includes('lassi') || cat.includes('drink') || cat.includes('snack') || name.includes('puri')) {
    station = 'sides_drinks';
  }

  return {
    cartItemId: `item_${Math.random().toString(36).substring(2, 9)}`,
    dish,
    quantity: qty,
    portion,
    spiceLevel,
    selectedAddons,
    specialNotes: notes,
    unitPrice,
    totalPrice,
    station,
    completedInKitchen: false,
  };
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-8826',
    orderNumber: '#HF-8826',
    type: 'dine_in',
    tableNumber: 'Table 01',
    customerName: 'Walk-in Guest',
    customerPhone: '+63 917 882 6100',
    items: [
      createItem('4066', 1, 2, 3, [0, 1], 'Extra salan gravy on the side please'),
      createItem('4061', 2, 0, 4, [], 'Well crisped, high spice'),
      createItem('4058', 2, 0, 2),
      createItem('4064', 6, 0, 1),
    ],
    subtotal: 2190,
    tax: 110,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 2300,
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 mins ago
    estimatedMinutes: 20,
    specialNotes: 'VIP guest table - serving hot bread immediately upon order',
  },
  {
    id: 'ord-8825',
    orderNumber: '#HF-8825',
    type: 'dine_in',
    tableNumber: 'Table 04',
    customerName: 'Ahmad Al-Mansoor',
    customerPhone: '+63 920 455 1290',
    items: [
      createItem('4055', 2, 0, 3, [0], 'Garnish with extra ginger juliennes & fresh lime'),
      createItem('4023', 2, 0, 3),
      createItem('4064', 4, 0, 1),
    ],
    subtotal: 720,
    tax: 36,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 756,
    status: 'preparing',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    cashTendered: 1000,
    changeDue: 244,
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    estimatedMinutes: 25,
  },
  {
    id: 'ord-8824',
    orderNumber: '#HF-8824',
    type: 'takeout',
    customerName: 'Fatima Zahra',
    customerPhone: '+63 908 122 8841',
    items: [
      createItem('4066', 1, 0, 2, [0, 1]),
      createItem('4024', 2, 0, 3, [], 'Extra spicy sour mint water'),
    ],
    subtotal: 1385,
    tax: 69,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 1454,
    status: 'preparing',
    paymentMethod: 'gcash',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 mins ago (Urgent Red)
    estimatedMinutes: 15,
    specialNotes: 'Pack mint water in sealed double containers',
  },
  {
    id: 'ord-8823',
    orderNumber: '#HF-8823',
    type: 'delivery',
    customerName: 'Tariq Mehmood',
    customerPhone: '+63 927 334 9901',
    deliveryAddress: 'Unit 14B Horizon Towers, Makati City',
    items: [
      createItem('4023', 3, 0, 3),
      createItem('4061', 2, 0, 3),
      createItem('4027', 2, 0, 2),
    ],
    subtotal: 830,
    tax: 42,
    serviceFee: 0,
    deliveryFee: 65,
    discount: 0,
    total: 937,
    status: 'ready',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 mins ago
    estimatedMinutes: 30,
    specialNotes: 'Rider waiting at front desk counter',
  },
  {
    id: 'ord-8822',
    orderNumber: '#HF-8822',
    type: 'dine_in',
    tableNumber: 'Table 07',
    customerName: 'Rashid Khan',
    customerPhone: '+63 915 777 3410',
    items: [
      createItem('4066', 1, 1, 3, [0]),
      createItem('4058', 2, 0, 2),
      createItem('4064', 4, 0, 1),
    ],
    subtotal: 1600,
    tax: 80,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 1680,
    status: 'completed',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    cashTendered: 2000,
    changeDue: 320,
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    estimatedMinutes: 20,
  },
  {
    id: 'ord-8821',
    orderNumber: '#HF-8821',
    type: 'takeout',
    customerName: 'Sara Qureshi',
    customerPhone: '+63 919 444 8812',
    items: [
      createItem('4025', 2, 0, 2),
      createItem('4026', 1, 0, 2),
      createItem('4024', 1, 0, 3),
    ],
    subtotal: 400,
    tax: 20,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 420,
    status: 'completed',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    estimatedMinutes: 15,
  },
  {
    id: 'ord-8820',
    orderNumber: '#HF-8820',
    type: 'dine_in',
    tableNumber: 'Table 02',
    customerName: 'Bilal Farooq',
    customerPhone: '+63 918 555 9920',
    items: [
      createItem('4055', 2, 0, 4, [0]),
      createItem('4064', 6, 0, 1),
    ],
    subtotal: 450,
    tax: 23,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    total: 473,
    status: 'completed',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    cashTendered: 500,
    changeDue: 27,
    createdAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    estimatedMinutes: 15,
  },
];
