'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

const currencyOptions = [
  { code: 'USD', country: 'United States' },
  { code: 'INR', country: 'India' },
  { code: 'CAD', country: 'Canada' }
];

const defaultPreferences = {
  theme: 'dark',
  accent: '#7c83ff',
  radius: 14,
  density: 'comfortable'
};

function formatMoney(value, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
}

export default function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    category: '',
    note: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('expense-prefs-v2');
    if (saved) setPrefs({ ...defaultPreferences, ...JSON.parse(saved) });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.style.setProperty('--accent', prefs.accent);
    document.documentElement.style.setProperty('--radius', `${prefs.radius}px`);
    document.documentElement.style.setProperty('--item-padding', prefs.density === 'compact' ? '0.55rem' : '0.85rem');
    localStorage.setItem('expense-prefs-v2', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    startTransition(async () => {
      const res = await fetch('/api/expenses', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Unable to load expenses.');
        return;
      }
      setExpenses(data);
    });
  }, []);

  const currentCurrencyInfo = currencyOptions.find((item) => item.code === currency);

  const visibleExpenses = useMemo(() => expenses.filter((item) => item.currency === currency), [expenses, currency]);

  const total = useMemo(() => visibleExpenses.reduce((sum, item) => sum + Number(item.amount), 0), [visibleExpenses]);

  async function addExpense(event) {
    event.preventDefault();
    setError('');
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      occurredAt: form.date,
      category: form.category,
      note: form.note,
      currency,
      country: currentCurrencyInfo?.country || 'Unknown'
    };

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Save failed.');
      return;
    }

    setExpenses((prev) => [data, ...prev]);
    setForm((prev) => ({ ...prev, title: '', amount: '', category: '', note: '' }));
  }

  async function removeExpense(id) {
    const previous = expenses;
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setExpenses(previous);
      setError('Delete failed.');
    }
  }

  return (
    <main className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">Expense tracker</p>
          <h1>Fast + customizable</h1>
        </div>
        <button className="control" onClick={() => setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}>
          {prefs.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <section className="card grid-2">
        <article>
          <p className="muted">Currency</p>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code} — {option.country}
              </option>
            ))}
          </select>
        </article>
        <article>
          <p className="muted">Total ({currency})</p>
          <h2>{formatMoney(total, currency)}</h2>
          <p className="muted">{visibleExpenses.length} entries</p>
        </article>
      </section>

      <section className="card">
        <div className="list-head">
          <h2>Customization</h2>
        </div>
        <div className="custom-grid">
          <label>
            Accent
            <input className="input" type="color" value={prefs.accent} onChange={(e) => setPrefs((p) => ({ ...p, accent: e.target.value }))} />
          </label>
          <label>
            Corner radius: {prefs.radius}px
            <input
              className="input"
              type="range"
              min="8"
              max="26"
              value={prefs.radius}
              onChange={(e) => setPrefs((p) => ({ ...p, radius: Number(e.target.value) }))}
            />
          </label>
          <label>
            Density
            <select className="input" value={prefs.density} onChange={(e) => setPrefs((p) => ({ ...p, density: e.target.value }))}>
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Add expense</h2>
        <form className="form" onSubmit={addExpense}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <div className="grid-2">
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          <input className="input" placeholder="Category (optional)" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <textarea className="input" placeholder="Note (optional)" rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          <button className="btn" type="submit">Save</button>
        </form>
      </section>

      <section className="card">
        <div className="list-head">
          <h2>{currency} expenses</h2>
          {loading && <span className="muted">Loading…</span>}
        </div>
        {error && <p className="error">{error}</p>}
        <ul className="list">
          {visibleExpenses.map((item) => (
            <li className="item" key={item.id}>
              <div>
                <p className="item-title">{item.title}</p>
                <p className="muted">{new Date(item.occurredAt).toLocaleDateString()} · {item.country}</p>
              </div>
              <div className="item-right">
                <strong>{formatMoney(Number(item.amount), item.currency)}</strong>
                <button className="link" type="button" onClick={() => removeExpense(item.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
