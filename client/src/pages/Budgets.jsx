import { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import api from '../api/axios';
import { CATEGORIES, formatINR, formatINRShort } from '../utils/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const EMPTY_FORM = { category: 'Food & Dining', limit: '' };

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/budgets', { params: { month, year } });
    setBudgets(data);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/budgets', { ...form, limit: Number(form.limit), month, year });
      setForm(EMPTY_FORM); fetchBudgets();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const barData = {
    labels: budgets.map((b) => b.category),
    datasets: [
      { label: 'Budget (₹)', data: budgets.map((b) => b.limit), backgroundColor: 'rgba(78,140,255,0.3)', borderColor: '#4e8cff', borderWidth: 1 },
      { label: 'Spent (₹)', data: budgets.map((b) => b.spent), backgroundColor: 'rgba(240,75,106,0.4)', borderColor: '#f04b6a', borderWidth: 1 },
    ],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8b90a0', boxWidth: 10, font: { size: 11 } } },
      tooltip: { backgroundColor: '#1a1e28', borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1, titleColor: '#e8eaf0', bodyColor: '#8b90a0', callbacks: { label: (ctx) => ` ${formatINR(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555b6e', font: { size: 10 }, maxRotation: 30 } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555b6e', font: { size: 11 }, callback: (v) => formatINRShort(v) } },
    },
  };

  const overBudget = budgets.filter((b) => b.spent > b.limit);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-sub">{now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {overBudget.length > 0 && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(240,75,106,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
          ⚠ Over budget in: {overBudget.map((b) => b.category).join(', ')}
        </div>
      )}

      {budgets.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Budget</div>
            <div className="stat-value">{formatINRShort(totalBudget)}</div>
            <div className="stat-change">{formatINR(totalBudget)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className={`stat-value ${totalSpent > totalBudget ? 'red' : 'green'}`}>{formatINRShort(totalSpent)}</div>
            <div className="stat-change">{formatINR(totalSpent)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className={`stat-value ${totalBudget - totalSpent < 0 ? 'red' : 'green'}`}>{formatINRShort(Math.abs(totalBudget - totalSpent))}</div>
            <div className="stat-change">{totalBudget - totalSpent < 0 ? 'Over budget' : 'Left to spend'}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          {budgets.length > 0 && (
            <div className="chart-card" style={{ marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
              <div className="chart-title">Budget vs Actual (₹)</div>
              <div style={{ height: 200 }}><Bar data={barData} options={barOptions} /></div>
            </div>
          )}

          <div className="card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>
            ) : budgets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No budgets set. Add one to the right.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {budgets.map((b) => {
                  const pct = Math.min(b.percentUsed, 100);
                  const over = b.spent > b.limit;
                  const color = over ? 'var(--red)' : pct > 75 ? 'var(--amber)' : 'var(--green)';
                  return (
                    <div key={b._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 500, color: 'var(--text)' }}>{b.category}</span>
                          {over && <span className="badge badge-red" style={{ marginLeft: 8 }}>Over budget</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)' }}>
                            <span style={{ color }}>{formatINR(b.spent)}</span> / {formatINR(b.limit)}
                          </span>
                          <button className="btn btn-danger btn-sm" onClick={() => api.delete(`/budgets/${b._id}`).then(fetchBudgets)}>Remove</button>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        {over ? `${formatINR(Math.abs(b.remaining))} over` : `${formatINR(b.remaining)} remaining`} · {b.percentUsed}% used
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Set Monthly Budget</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => !['Salary','Freelance','Investment','Mutual Funds'].includes(c)).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Monthly Limit (₹)</label>
              <input type="number" step="100" min="1" placeholder="5000" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Saving...' : 'Set Budget'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
