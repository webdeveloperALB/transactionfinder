export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Basic Search',
    price: 0,
    searchDuration: 12, // 12 hours
    maxTransactions: 1,
    minAmount: 200, // euros
    maxAmount: 1000, // euros
    percentageRange: {
      min: 0.0002, // 0.02%
      max: 0.0005, // 0.05%
    },
    features: [
      'Basic transaction search',
      'Standard database scan',
      'Email notifications',
      'Basic support'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Professional Search',
    price: 150,
    searchDuration: 72, // 72 hours
    maxTransactions: 3,
    features: [
      'Extended transaction search',
      'Advanced database scan',
      'Priority support',
      'ChatGPT 4 assistance',
      'Real-time notifications'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Search',
    price: 500,
    searchDuration: 168, // 1 week (168 hours)
    maxTransactions: 3,
    features: [
      'Comprehensive transaction search',
      'Global database access',
      'Dedicated support team',
      'ChatGPT 4 Pro assistance',
      'Advanced analytics',
      'Custom recovery strategies'
    ]
  }
};