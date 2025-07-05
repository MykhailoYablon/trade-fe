import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';

function Home() {
  return <div>Welcome to the Home page!</div>;
}

function Trades() {
  const [trades, setTrades] = useState<{
    id?: number;
    symbol: string;
    quantity: any;
    price: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:8080/trades');
      const data = Array.isArray(res.data) ? res.data : [];
      setTrades(data);
      if (!Array.isArray(res.data)) {
        setError('Response from /trades is not an array.');
      }
    } catch (err: any) {
      setError('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('http://localhost:8080/trades', {
        symbol: form.symbol,
        quantity: Number(form.quantity),
        price: Number(form.price),
      });
      setShowForm(false);
      setForm({ symbol: '', quantity: '', price: '' });
      fetchTrades();
    } catch (err: any) {
      setError('Failed to create trade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Trades</h2>
      <button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>Create Trade</button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#222', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <input name="symbol" placeholder="Symbol" value={form.symbol} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={handleInputChange} required />
          </div>
          <button type="submit" disabled={submitting}>Submit</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #444', padding: 8 }}>Symbol</th>
              <th style={{ border: '1px solid #444', padding: 8 }}>Quantity</th>
              <th style={{ border: '1px solid #444', padding: 8 }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(trade => (
              <tr key={trade.symbol}>
                <td style={{ border: '1px solid #444', padding: 8 }}>{trade.symbol}</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>
                  {typeof trade.quantity === 'object' && trade.quantity !== null 
                    ? (trade.quantity.toString ? trade.quantity.toString() : JSON.stringify(trade.quantity))
                    : trade.quantity}
                </td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{trade.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Statistics() {
  return <div>Statistics will be shown here.</div>;
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        <nav style={{ width: 220, background: '#20232a', color: '#fff', padding: '2rem 1rem', minHeight: '100vh' }}>
          <h2 style={{ color: '#61dafb' }}>Trade FE</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ margin: '1rem 0' }}><Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ margin: '1rem 0' }}><Link to="/trades" style={{ color: '#fff', textDecoration: 'none' }}>Trades</Link></li>
            <li style={{ margin: '1rem 0' }}><Link to="/statistics" style={{ color: '#fff', textDecoration: 'none' }}>Statistics</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, background: '#282c34', color: '#fff', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
