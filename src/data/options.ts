import { AddonOption, PortionOption } from '@/types';

export const PORTION_OPTIONS: PortionOption[] = [
  { id: 'regular', name: 'Regular Portion', priceDelta: 0, serves: '1 Person' },
  { id: 'double', name: 'Double Special', priceDelta: 140, serves: '2 People' },
  { id: 'family', name: 'Family Platter / Bilao', priceDelta: 480, serves: '4-5 People' },
];

export const ADDON_OPTIONS: AddonOption[] = [
  { id: 'raitha', name: 'Extra Mint Cucumber Raitha', price: 45 },
  { id: 'egg', name: 'Spiced Boiled Egg (2 pcs)', price: 40 },
  { id: 'gravy', name: 'Special Salan / Extra Biryani Gravy', price: 50 },
  { id: 'roti', name: 'Fresh Hot Tandoori Roti', price: 35 },
  { id: 'gulab', name: 'Gulab Jamun Dessert (2 pcs)', price: 75 },
  { id: 'lassi', name: 'Sweet Mango Lassi Glass', price: 95 },
];

export const SPICE_LEVELS = [
  { level: 1, label: 'Mild', description: 'Gentle aromatic spices, child-friendly', icon: '🌱' },
  { level: 2, label: 'Medium', description: 'Classic Pakistani heat with fragrant herbs', icon: '🌶️' },
  { level: 3, label: 'Spicy', description: 'Authentic kick for spice lovers', icon: '🌶️🌶️' },
  { level: 4, label: 'Fiery Hasan Special', description: 'High-heat Naga / green chilli blast', icon: '🔥🌶️' },
];

export const TABLES = [
  'Table 01',
  'Table 02',
  'Table 03',
  'Table 04',
  'Table 05',
  'Table 06',
  'Table 07',
  'Table 08',
  'Table 09',
  'Table 10',
  'Table 11',
  'Table 12',
  'Outdoor Patio 01',
  'Outdoor Patio 02',
  'VIP Dining 01',
];

export const CASH_PRESETS = [100, 200, 500, 1000, 2000];
