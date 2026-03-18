import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { CATEGORIES, PAYMENT_MODES, formatINR } from '../utils/constants';

const EMPTY_FORM = {
  type: 'expense', amount: '', category: 'Food & Dining',
  description: '', date: format(new Date(), 'yyyy-MM-dd'),
  tags: '', paymentMode: 'UPI',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ type: '', category: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 15 };
      if (!params.type) delete params.type;
      if (!params.category) delete params.category;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (tx) => {
    setForm({ type: tx.type, amount: tx.amount, category: tx.category, description: tx.description || '', date: format(new Date(tx.date), 'yyyy-MM-dd'), tags: tx.tags?.join(', ') || '', paymentMode: tx.paymentMode || 'UPI' });
    setEditId(tx._id); setError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, amount: Number(form.amount), tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] };
      if (editId) await api.put(`/transactions/${editId}`, payload);
      else await api.post('/transactions', payload);
      setShowModal(false); fetchTransactions();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`); fetchTransactions();
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transactions</h1><p className="page-sub">Track every rupee in and out</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })} style={{ width: 'auto', minWidth: 120 }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })} style={{ width: 'auto', minWidth: 180 }}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No transactions found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Description</th><th>Category</th><th>Mode</th><th>Type</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr></thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text)' }}>{tx.description || '—'}</td>
                    <td><span className="badge badge-blue">{tx.category}</span></td>
                    <td><span className="badge badge-amber">{tx.paymentMode || 'UPI'}</span></td>
                    <td><span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>{tx.type}</span></td>
                    <td>{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 500, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilters({ ...filters, page: p })}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" step="1" min="1" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                    {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="e.g. Swiggy order, Electricity bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input type="text" placeholder="food, monthly" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
