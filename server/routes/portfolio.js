const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/portfolio/watchlist
router.get('/watchlist', async (req, res) => {
  res.json({ watchlist: req.user.watchlist });
});

// POST /api/portfolio/watchlist — add ticker
router.post('/watchlist', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ message: 'Ticker is required.' });

    const symbol = ticker.toUpperCase().trim();
    if (req.user.watchlist.includes(symbol)) {
      return res.status(409).json({ message: `${symbol} is already in your watchlist.` });
    }
    if (req.user.watchlist.length >= 10) {
      return res.status(400).json({ message: 'Watchlist limit is 10 tickers.' });
    }

    req.user.watchlist.push(symbol);
    await req.user.save({ validateBeforeSave: false });
    res.status(201).json({ watchlist: req.user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/portfolio/watchlist/:ticker
router.delete('/watchlist/:ticker', async (req, res) => {
  try {
    const symbol = req.params.ticker.toUpperCase();
    req.user.watchlist = req.user.watchlist.filter((t) => t !== symbol);
    await req.user.save({ validateBeforeSave: false });
    res.json({ watchlist: req.user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/portfolio/alerts
router.get('/alerts', async (req, res) => {
  res.json({ alerts: req.user.priceAlerts });
});

// POST /api/portfolio/alerts
router.post('/alerts', async (req, res) => {
  try {
    const { ticker, targetPrice, condition } = req.body;
    if (!ticker || !targetPrice || !condition) {
      return res.status(400).json({ message: 'ticker, targetPrice and condition are required.' });
    }

    req.user.priceAlerts.push({
      ticker: ticker.toUpperCase(),
      targetPrice: Number(targetPrice),
      condition,
      triggered: false,
    });

    await req.user.save({ validateBeforeSave: false });
    res.status(201).json({ alerts: req.user.priceAlerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/portfolio/alerts/:alertId
router.delete('/alerts/:alertId', async (req, res) => {
  try {
    req.user.priceAlerts = req.user.priceAlerts.filter(
      (a) => a._id.toString() !== req.params.alertId
    );
    await req.user.save({ validateBeforeSave: false });
    res.json({ alerts: req.user.priceAlerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
