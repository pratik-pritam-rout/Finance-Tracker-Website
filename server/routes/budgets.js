const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/budgets?month=&year= — with actual spend
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Get actual spending per category this month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const actuals = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spentMap = Object.fromEntries(actuals.map((a) => [a._id, a.spent]));

    const result = budgets.map((b) => ({
      ...b.toObject(),
      spent: spentMap[b.category] || 0,
      remaining: b.limit - (spentMap[b.category] || 0),
      percentUsed: Math.round(((spentMap[b.category] || 0) / b.limit) * 100),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/budgets — create or update (upsert)
router.post('/', async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    const now = new Date();

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category,
        month: month || now.getMonth() + 1,
        year: year || now.getFullYear(),
      },
      { limit },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found.' });
    res.json({ message: 'Budget deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
