/**
 * All colors used in inline JS styles across the app.
 *
 * NativeWind className-based colours (e.g. bg-indigo-600) are driven by
 * tailwind.config.js, which reads its palette from config/brand.js.
 * Keep brand.primary here in sync with brand.js if you change the brand colour.
 */

/** Branzia brand green — mirrors the "indigo" palette in tailwind.config.js. */
export const brand = {
  primary: '#1D9E75',
  50:  '#E9F9F1',
  100: '#D1F3E6',
  200: '#9FE1CB',
  300: '#5DCAA5',
  400: '#2EB88A',
  500: '#1D9E75',
  600: '#1D9E75',
  700: '#0F6E56',
  800: '#004E3B',
  900: '#003D2E',
  950: '#002D23',
} as const;

/** Order status badge colours. */
export const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B' },
};

/** Subscription plan card colours. */
export const planColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  starter: { bg: '#F9FAFB', border: '#E5E7EB', badge: '#6B7280', text: '#374151' },
  growth:  { bg: '#EEF2FF', border: '#C7D2FE', badge: '#4F46E5', text: '#3730A3' },
  pro:     { bg: '#FDF4FF', border: '#E9D5FF', badge: '#7C3AED', text: '#5B21B6' },
};

/** Dashboard stat card label colours. */
export const statColors = {
  ordersToday:   '#111827',
  revenueToday:  '#4F46E5',
  revenueMonth:  '#10B981',
  totalProducts: '#111827',
} as const;

/** General-purpose UI palette for inline styles. */
export const ui = {
  /** Primary accent used for active tabs, buttons, links, and icons. */
  accent:         brand.primary,
  skeletonBg:     '#E5E7EB',
  placeholderText:'#9CA3AF',
  toggleActive:   brand.primary,
  toggleInactive: '#D1D5DB',
  modalBackdrop:  'rgba(0,0,0,0.4)',
  borderLight:    '#F3F4F6',
  borderLighter:  '#F9FAFB',
} as const;
