const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/transactions — paginated list with filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate, sort = '-date' } = req.query;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date, tags } = req.body;
    const transaction = await Transaction.create({
      user: req.user._id,
      type, amount, category, description, date, tags,
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/transactions/summary — spending by category (current month)
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = Number(month) || now.getMonth() + 1;
    const y = Number(year) || now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    // MongoDB aggregation pipeline
    const [categoryBreakdown, monthlyTrend, totals] = await Promise.all([
      // Spending by category this month
      Transaction.aggregate([
        { $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // Monthly income vs expense for last 6 months
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: new Date(y, m - 7, 1), $lte: end },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Total income and expense this month
      Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
    ]);

    const income = totals.find((t) => t._id === 'income')?.total || 0;
    const expenses = totals.find((t) => t._id === 'expense')?.total || 0;

    res.json({
      categoryBreakdown,
      monthlyTrend,
      summary: { income, expenses, net: income - expenses },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
