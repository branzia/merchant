export const app = {
  brandName: 'Branzia',
  appName: 'Branzia Merchant',
  /** WhatsApp number (without +) for the shop opening request flow. */
  whatsappNumber: '917358720104',
  /** Subscription plans shown on the registration screen. */
  plans: ['Starter', 'Growth', 'Pro'] as const,
  /** Theme color passed to the Razorpay checkout sheet. */
  razorpayThemeColor: '#4F46E5',
  storageKeys: {
    token: 'bearer_token',
    merchant: 'cached_merchant',
  },
  /**
   * Feature flags — set to false to hide features that depend on
   * Branzia-specific infrastructure (e.g. Razorpay billing).
   * Useful when running this app as a white-label or open-source fork.
   */
  features: {
    /** Show the subscription plan card and billing/upgrade screens. */
    billing: true,
  },
} as const;

export type Plan = (typeof app.plans)[number];
