const axios = require('axios');
const User = require('../models/User');

const priceCache = {};

async function fetchNSEPrice(ticker) {
  try {
    const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`;
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: { interval: '1m', range: '1d' },
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        timeout: 6000,
      }
    );
    const result = data?.chart?.result?.[0];
    if (!result) return simulatePrice(ticker);
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose || meta.chartPreviousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return {
      ticker,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      currency: 'INR',
      exchange: 'NSE',
      name: meta.longName || meta.shortName || ticker,
    };
  } catch {
    return simulatePrice(ticker);
  }
}

function simulatePrice(ticker) {
  const bases = {
    RELIANCE: 2950, TCS: 4100, INFY: 1850, HDFCBANK: 1680,
    WIPRO: 520, ICICIBANK: 1250, SBIN: 830, BAJFINANCE: 7200,
    HCLTECH: 1920, KOTAKBANK: 1780, LT: 3600, AXISBANK: 1180,
    MARUTI: 12500, TATAMOTORS: 1020, SUNPHARMA: 1890,
  };
  const base = priceCache[ticker]?.price || bases[ticker] || (500 + Math.random() * 2000);
  const changeAmt = (Math.random() - 0.5) * base * 0.012;
  const price = parseFloat((base + changeAmt).toFixed(2));
  return {
    ticker,
    price,
    change: parseFloat(changeAmt.toFixed(2)),
    changePercent: parseFloat(((changeAmt / base) * 100).toFixed(2)),
    currency: 'INR',
    exchange: 'NSE',
    name: ticker,
  };
}

async function checkAlerts(io, ticker, price) {
  try {
    const users = await User.find({ 'priceAlerts.ticker': ticker, 'priceAlerts.triggered': false }).select('+priceAlerts');
    for (const user of users) {
      let updated = false;
      for (const alert of user.priceAlerts.filter((a) => a.ticker === ticker && !a.triggered)) {
        const triggered = (alert.condition === 'above' && price >= alert.targetPrice) || (alert.condition === 'below' && price <= alert.targetPrice);
        if (triggered) {
          alert.triggered = true;
          updated = true;
          io.to(`user:${user._id}`).emit('price_alert', {
            ticker, price, targetPrice: alert.targetPrice, condition: alert.condition,
            message: `${ticker} hit ₹${price.toLocaleString('en-IN')} (target: ${alert.condition} ₹${alert.targetPrice.toLocaleString('en-IN')})`,
          });
        }
      }
      if (updated) await user.save({ validateBeforeSave: false });
    }
  } catch (err) {
    console.error('Alert check error:', err.message);
  }
}

function isMarketOpen() {
  const IST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const day = IST.getUTCDay();
  const mins = IST.getUTCHours() * 60 + IST.getUTCMinutes();
  return day >= 1 && day <= 5 && mins >= 555 && mins <= 930;
}

function initPriceSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    socket.on('join', (userId) => { if (userId) socket.join(`user:${userId}`); });
    socket.on('subscribe', (tickers) => { if (Array.isArray(tickers)) tickers.forEach((t) => socket.join(`ticker:${t.toUpperCase()}`)); });
    socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
  });

  setInterval(async () => {
    try {
      const users = await User.find({}, 'watchlist').lean();
      const allTickers = [...new Set(users.flatMap((u) => u.watchlist))];
      if (!allTickers.length) return;
      const marketOpen = isMarketOpen();
      const results = await Promise.allSettled(allTickers.map((t) => marketOpen ? fetchNSEPrice(t) : simulatePrice(t)));
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value) continue;
        priceCache[r.value.ticker] = r.value;
        io.to(`ticker:${r.value.ticker}`).emit('price_update', r.value);
        await checkAlerts(io, r.value.ticker, r.value.price);
      }
      io.emit('prices_bulk', Object.values(priceCache));
      io.emit('market_status', { open: marketOpen, exchange: 'NSE/BSE' });
    } catch (err) {
      console.error('Price polling error:', err.message);
    }
  }, 15000);

  console.log('📈 NSE/BSE price socket initialized');
}

module.exports = { initPriceSocket };
