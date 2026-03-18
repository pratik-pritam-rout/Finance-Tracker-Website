import { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatINRShort } from '../utils/constants';
import { format } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const CHART_COLORS = ['#4e8cff','#22d3a8','#f5a623','#f04b6a','#a78bfa','#34d399','#fb923c','#60a5fa','#f472b6','#818cf8'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/transactions/summary'),
      api.get('/transactions?limit=5&sort=-date'),
    ]).then(([sumRes, txRes]) => {
      setSummary(sumRes.data);
      setRecentTx(txRes.data.transactions);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;

  const { summary: totals = {}, categoryBreakdown = [], monthlyTrend = [] } = summary || {};

  const doughnutData = {
    labels: categoryBreakdown.map((c) => c._id),
    datasets: [{ data: categoryBreakdown.map((c) => c.total), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 4 }],
  };

  const months = [...new Set(monthlyTrend.map((d) => `${d._id.year}-${String(d._id.month).padStart(2,'0')}`))].sort().slice(-6);
  const incomeData = months.map((m) => { const [y,mo] = m.split('-'); return monthlyTrend.find((d) => d._id.year===Number(y)&&d._id.month===Number(mo)&&d._id.type==='income')?.total||0; });
  const expenseData = months.map((m) => { const [y,mo] = m.split('-'); return monthlyTrend.find((d) => d._id.year===Number(y)&&d._id.month===Number(mo)&&d._id.type==='expense')?.total||0; });

  const lineData = {
    labels: months.map((m) => format(new Date(m), 'MMM')),
    datasets: [
      { label: 'Income', data: incomeData, borderColor: '#22d3a8', backgroundColor: 'rgba(34,211,168,0.08)', fill: true, tension: 0.4, pointRadius: 3 },
      { label: 'Expenses', data: expenseData, borderColor: '#f04b6a', backgroundColor: 'rgba(240,75,106,0.08)', fill: true, tension: 0.4, pointRadius: 3 },
    ],
  };

  const tooltipStyle = { backgroundColor: '#1a1e28', borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1, titleColor: '#e8eaf0', bodyColor: '#8b90a0', padding: 10 };
  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { color: '#8b90a0', boxWidth: 10, font: { size: 11 } } }, tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => ` ${formatINR(ctx.parsed.y)}` } } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555b6e', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555b6e', font: { size: 11 }, callback: (v) => formatINRShort(v) } } },
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => ` ${formatINR(ctx.parsed)}` } } },
  };

  const net = totals.net || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{format(new Date(), 'MMMM yyyy')}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value green">{formatINRShort(totals.income)}</div>
          <div className="stat-change">{formatINR(totals.income)} this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value red">{formatINRShort(totals.expenses)}</div>
          <div className="stat-change">{formatINR(totals.expenses)} this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Savings</div>
          <div className={`stat-value ${net >= 0 ? 'green' : 'red'}`}>{formatINRShort(net)}</div>
          <div className="stat-change">{net >= 0 ? 'Saved' : 'Overspent'} {formatINR(Math.abs(net))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categoryBreakdown.length}</div>
          <div className="stat-change">Active this month</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Monthly Trend (₹)</div>
          <div className="chart-wrap"><Line data={lineData} options={lineOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Spending by Category</div>
          {categoryBreakdown.length ? (
            <div className="chart-wrap"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 60 }}>No expenses this month</div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="chart-title" style={{ margin: 0 }}>Recent Transactions</div>
          <a href="/transactions" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>View all →</a>
        </div>
        {recentTx.length === 0 ? (
          <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>No transactions yet. Add your first one!</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Description</th><th>Category</th><th>Mode</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {recentTx.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text)' }}>{tx.description || '—'}</td>
                    <td><span className="badge badge-blue">{tx.category}</span></td>
                    <td><span className="badge badge-amber">{tx.paymentMode || 'UPI'}</span></td>
                    <td>{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 500, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
