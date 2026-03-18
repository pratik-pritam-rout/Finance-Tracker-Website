const mongoose = require('mongoose');

const CATEGORIES = [
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

const PAYMENT_MODES = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'EMI'];

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive'],
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  tags: [{ type: String, trim: true }],
  paymentMode: {
    type: String,
    enum: PAYMENT_MODES,
    default: 'UPI',
  },
}, { timestamps: true });

// Index for fast user + date queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PAYMENT_MODES = PAYMENT_MODES;
