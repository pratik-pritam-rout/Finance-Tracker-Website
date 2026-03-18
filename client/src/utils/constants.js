export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'House Rent',
  'EMI / Loan',
  'Transportation',
  'Auto / Cab',
  'Entertainment',
  'Health & Medical',
  'Travel',
  'Education',
  'Electricity & Bills',
  'Mobile Recharge',
  'OTT Subscriptions',
  'Clothing',
  'Salary',
  'Freelance',
  'Investment',
  'Mutual Funds',
  'Other',
];

// Top NSE stocks for default watchlist
export const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO'];

// Indian UPI / payment methods
export const PAYMENT_MODES = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'EMI'];

export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

// Format number in Indian numbering system (lakhs, crores)
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Short format: 1,50,000 → ₹1.5L, 1,00,00,000 → ₹1Cr
export function formatINRShort(amount) {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}
