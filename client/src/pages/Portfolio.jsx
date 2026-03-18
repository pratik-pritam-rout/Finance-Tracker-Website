import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatINR } from '../utils/constants';

const POPULAR_NSE = ['RELIANCE','TCS','INFY','HDFCBANK','WIPRO','ICICIBANK','SBIN','BAJFINANCE','HCLTECH','KOTAKBANK','LT','AXISBANK','MARUTI','TATAMOTORS','SUNPHARMA'];

export default function Portfolio() {
  const { prices, connected } = useSocket();
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [newTicker, setNewTicker] = useState('');
  const [alertForm, setAlertForm] = useState({ ticker: '', targetPrice: '', condition: 'above' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('market_status', (status) => setMarketStatus(status));
    return () => socket.off('market_status');
  }, [socket]);

  const fetchData = useCallback(async () => {
    const [wlRes, alertRes] = await Promise.all([
      api.get('/portfolio/watchlist'),
      api.get('/portfolio/alerts'),
    ]);
    setWatchlist(wlRes.data.watchlist);
    setAlerts(alertRes.data.alerts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addTicker = async (ticker) => {
    const t = (ticker || newTicker).toUpperCase().trim();
    if (!t) return;
    setError('');
    try {
      const { data } = await api.post('/portfolio/watchlist', { ticker: t });
      setWatchlist(data.watchlist);
      setNewTicker('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to add ticker.'); }
  };

  const removeTicker = async (ticker) => {
    const { data } = await api.delete(`/portfolio/watchlist/${ticker}`);
    setWatchlist(data.watchlist);
  };

  const addAlert = async (e) => {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/portfolio/alerts', alertForm);
      setAlerts(data.alerts);
      setAlertForm({ ticker: '', targetPrice: '', condition: 'above' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to add alert.'); }
  };

  const fmtPrice = (n) => n ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-sub">
            NSE/BSE live prices ·{' '}
            {connected ? <span className="green">Connected</span> : <span style={{ color: 'var(--text3)' }}>Reconnecting…</span>}
            {marketStatus && (
              <span style={{ marginLeft: 8, color: marketStatus.open ? 'var(--green)' : 'var(--amber)' }}>
                · Market {marketStatus.open ? 'Open' : 'Closed'}
              </span>
            )}
          </p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Watchlist */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>My Watchlist (NSE)</h3>
          <form onSubmit={(e) => { e.preventDefault(); addTicker(); }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input type="text" placeholder="e.g. TATAMOTORS" value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())} style={{ flex: 1, textTransform: 'uppercase' }} maxLength={20} />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Add</button>
          </form>

          {/* Quick add popular stocks */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick add</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POPULAR_NSE.filter((t) => !watchlist.includes(t)).slice(0, 8).map((t) => (
                <button key={t} className="btn btn-ghost btn-sm" onClick={() => addTicker(t)} style={{ fontSize: 11, padding: '4px 8px' }}>{t}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Loading...</div>
          ) : watchlist.length === 0 ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Add NSE stocks to your watchlist</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {watchlist.map((ticker) => {
                const p = prices[ticker];
                const isUp = (p?.changePercent ?? 0) >= 0;
                return (
                  <div key={ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', borderRadius: 'var(--radius-sm)', cursor: 'default' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 14 }}>{ticker}</div>
                      {p?.name && p.name !== ticker && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.name}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14 }}>{fmtPrice(p?.price)}</div>
                        {p && <div style={{ fontSize: 11, color: isUp ? 'var(--green)' : 'var(--red)' }}>
                          {isUp ? '▲' : '▼'} {Math.abs(p.changePercent || 0).toFixed(2)}%
                        </div>}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeTicker(ticker)} style={{ color: 'var(--text3)', padding: '4px 8px' }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Alerts */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Price Alerts</h3>
          <form onSubmit={addAlert} style={{ marginBottom: 20 }}>
            <div className="form-row">
              <div className="form-group">
                <label>NSE Ticker</label>
                <input type="text" placeholder="RELIANCE" value={alertForm.ticker} onChange={(e) => setAlertForm({ ...alertForm, ticker: e.target.value.toUpperCase() })} style={{ textTransform: 'uppercase' }} required />
              </div>
              <div className="form-group">
                <label>Condition</label>
                <select value={alertForm.condition} onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}>
                  <option value="above">Price above</option>
                  <option value="below">Price below</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Target Price (₹)</label>
              <input type="number" step="0.05" min="1" placeholder="3000" value={alertForm.targetPrice} onChange={(e) => setAlertForm({ ...alertForm, targetPrice: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Set Alert</button>
          </form>

          {alerts.length === 0 ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>No alerts set</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((alert) => (
                <div key={alert._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', opacity: alert.triggered ? 0.5 : 1 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{alert.ticker}</span>
                    <span style={{ color: 'var(--text2)', fontSize: 13, marginLeft: 8 }}>
                      {alert.condition} ₹{Number(alert.targetPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {alert.triggered && <span className="badge badge-amber">Triggered</span>}
                    <button className="btn btn-ghost btn-sm" onClick={() => api.delete(`/portfolio/alerts/${alert._id}`).then(fetchData)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live prices grid */}
      {Object.keys(prices).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Live Market Data — NSE</h3>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Updates every 15s</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {Object.values(prices).map((p) => {
              const isUp = (p.changePercent ?? 0) >= 0;
              return (
                <div key={p.ticker} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', borderLeft: `3px solid ${isUp ? 'var(--green)' : 'var(--red)'}` }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{p.ticker}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 600 }}>{fmtPrice(p.price)}</div>
                  <div style={{ fontSize: 12, color: isUp ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
                    {isUp ? '▲' : '▼'} {Math.abs(p.changePercent || 0).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
