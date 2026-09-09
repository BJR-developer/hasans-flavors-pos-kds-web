// Order Visual Theme Palette Generator
// Assigns a distinct, high-contrast background and text color combination to each ticket

export interface OrderColorTheme {
  id: string;
  name: string;
  headerBg: string;      // Background color of header / banner
  headerText: string;    // Contrast font color (black or white)
  subText: string;       // Secondary label font color
  badgeBg: string;       // Pill badge background
  badgeText: string;     // Pill badge text color
  borderColor: string;   // Card outline accent
  lightBg: string;       // Subtle tint for body background
  accentDot: string;     // Solid indicator color
}

export const ORDER_COLOR_THEMES: OrderColorTheme[] = [
  // 1. Obsidian Black (White text)
  {
    id: 'obsidian',
    name: 'Obsidian Black',
    headerBg: 'bg-neutral-900',
    headerText: 'text-white',
    subText: 'text-neutral-300',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-neutral-300',
    lightBg: 'bg-neutral-50/50',
    accentDot: 'bg-neutral-900',
  },
  // 2. Saffron Yellow (Black text)
  {
    id: 'yellow',
    name: 'Saffron Yellow',
    headerBg: 'bg-amber-400',
    headerText: 'text-neutral-950 font-black',
    subText: 'text-neutral-900',
    badgeBg: 'bg-black/15 text-neutral-950',
    badgeText: 'text-neutral-950',
    borderColor: 'border-amber-300',
    lightBg: 'bg-amber-50/40',
    accentDot: 'bg-amber-500',
  },
  // 3. Crimson Red (White text)
  {
    id: 'red',
    name: 'Crimson Red',
    headerBg: 'bg-red-600',
    headerText: 'text-white',
    subText: 'text-red-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-red-300',
    lightBg: 'bg-red-50/40',
    accentDot: 'bg-red-600',
  },
  // 4. Emerald Green (White text)
  {
    id: 'green',
    name: 'Emerald Green',
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    subText: 'text-emerald-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-emerald-300',
    lightBg: 'bg-emerald-50/40',
    accentDot: 'bg-emerald-600',
  },
  // 5. Royal Blue (White text)
  {
    id: 'blue',
    name: 'Royal Blue',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    subText: 'text-blue-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-blue-300',
    lightBg: 'bg-blue-50/40',
    accentDot: 'bg-blue-600',
  },
  // 6. Deep Purple (White text)
  {
    id: 'purple',
    name: 'Deep Purple',
    headerBg: 'bg-purple-600',
    headerText: 'text-white',
    subText: 'text-purple-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-purple-300',
    lightBg: 'bg-purple-50/40',
    accentDot: 'bg-purple-600',
  },
  // 7. Vivid Orange (White text)
  {
    id: 'orange',
    name: 'Vivid Orange',
    headerBg: 'bg-orange-500',
    headerText: 'text-white',
    subText: 'text-orange-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-orange-300',
    lightBg: 'bg-orange-50/40',
    accentDot: 'bg-orange-500',
  },
  // 8. Teal Ocean (White text)
  {
    id: 'teal',
    name: 'Teal Ocean',
    headerBg: 'bg-teal-600',
    headerText: 'text-white',
    subText: 'text-teal-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-teal-300',
    lightBg: 'bg-teal-50/40',
    accentDot: 'bg-teal-600',
  },
  // 9. Rose Magenta (White text)
  {
    id: 'rose',
    name: 'Rose Magenta',
    headerBg: 'bg-rose-600',
    headerText: 'text-white',
    subText: 'text-rose-100',
    badgeBg: 'bg-white/20 text-white',
    badgeText: 'text-white',
    borderColor: 'border-rose-300',
    lightBg: 'bg-rose-50/40',
    accentDot: 'bg-rose-600',
  },
  // 10. Warm Gold (Black text)
  {
    id: 'gold',
    name: 'Warm Gold',
    headerBg: 'bg-yellow-300',
    headerText: 'text-neutral-950 font-black',
    subText: 'text-neutral-900',
    badgeBg: 'bg-black/15 text-neutral-950',
    badgeText: 'text-neutral-950',
    borderColor: 'border-yellow-300',
    lightBg: 'bg-yellow-50/40',
    accentDot: 'bg-yellow-500',
  },
];

// Generates or derives a consistent color theme for any order ID or order number
export function getOrderColorTheme(orderIdOrNumber: string): OrderColorTheme {
  if (!orderIdOrNumber) return ORDER_COLOR_THEMES[0];

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < orderIdOrNumber.length; i++) {
    hash = (hash << 5) - hash + orderIdOrNumber.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  const index = positiveHash % ORDER_COLOR_THEMES.length;
  return ORDER_COLOR_THEMES[index];
}
