import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Contract {
  conid: string;
  symbol: string;
  // Add other contract fields as needed
}

interface HistoricalData {
  position: Position;
  timestamp: string;
  timeframe: string;
  open: any; // BigDecimal from Java
  high: any; // BigDecimal from Java
  low: any; // BigDecimal from Java
  close: any; // BigDecimal from Java
  volume: number;
  count: number;
  wap: any; // BigDecimal from Java
}

interface Position {
  id?: number;
  conid: string;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
  quantity: any; // BigDecimal from Java
  avgPrice: any; // BigDecimal from Java
  updatedAt: string;
}

function Home() {
  return <div>Welcome to the Home page!</div>;
}

function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', avgPrice: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [timeframe, setTimeframe] = useState('FIVE_MIN'); // Default timeframe

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:8080/positions');
      const data = Array.isArray(res.data) ? res.data : [];
      setPositions(data);
      if (!Array.isArray(res.data)) {
        setError('Response from /positions is not an array.');
      }
    } catch (err: any) {
      setError('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (conid: string, selectedTimeframe: string = timeframe) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:8080/positions/${conid}/historical/${selectedTimeframe}`);
      setHistoricalData(res.data);
    } catch (err: any) {
      setError('Failed to fetch historical data');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('http://localhost:8080/positions', {
        symbol: form.symbol,
        quantity: Number(form.quantity),
        avgPrice: Number(form.avgPrice),
      });
      setShowForm(false);
      setForm({ symbol: '', quantity: '', avgPrice: '' });
      fetchPositions();
    } catch (err: any) {
      setError('Failed to create position');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
    fetchHistoricalData(position.conid, timeframe);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (selectedPosition) {
      fetchHistoricalData(selectedPosition.conid, newTimeframe);
    }
  };

  return (
    <div>
      <h2>Positions</h2>
      <button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>Create Position</button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#222', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <input name="symbol" placeholder="Symbol" value={form.symbol} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="avgPrice" type="number" step="0.01" placeholder="Average Price" value={form.avgPrice} onChange={handleInputChange} required />
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
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Symbol</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Sec Type</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Exchange</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Currency</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Quantity</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Avg Price</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr 
                    key={position.conid} 
                    onClick={() => handlePositionClick(position)}
                    style={{ cursor: 'pointer', backgroundColor: selectedPosition?.conid === position.conid ? '#444' : 'transparent' }}
                  >
                    <td style={{ border: '1px solid #444', padding: 8 }}>{position.symbol}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{position.secType}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{position.exchange}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{position.currency}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>
                      {typeof position.quantity === 'object' && position.quantity !== null 
                        ? (position.quantity.toString ? position.quantity.toString() : JSON.stringify(position.quantity))
                        : position.quantity}
                    </td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>
                      {typeof position.avgPrice === 'object' && position.avgPrice !== null 
                        ? (position.avgPrice.toString ? position.avgPrice.toString() : JSON.stringify(position.avgPrice))
                        : position.avgPrice}
                    </td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{position.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedPosition && (
            <div style={{ flex: 1 }}>
              <h3>Historical Data for {selectedPosition.symbol}</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ marginRight: 8 }}>Timeframe:</label>
                <select 
                  value={timeframe} 
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555' }}
                >
                  <option value="ONE_DAY">1 day</option>
                  <option value="ONE_MIN">1 min</option>
                  <option value="THREE_MIN">3 mins</option>
                  <option value="FIVE_MIN">5 mins</option>
                  <option value="FIFTEEN_MIN">15 mins</option>
                  <option value="THIRTY_MIN">30 mins</option>
                  <option value="ONE_HOUR">1 hour</option>
                  <option value="ONE_DAY">1 day</option>
                </select>
              </div>
              {loadingHistory ? (
                <div>Loading historical data...</div>
              ) : historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#8884d8" 
                      name="Close Price"
                      data={historicalData.map(item => ({
                        ...item,
                        close: typeof item.close === 'object' && item.close !== null 
                          ? (item.close.toString ? item.close.toString() : JSON.stringify(item.close))
                          : item.close
                      }))}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="high" 
                      stroke="#82ca9d" 
                      name="High"
                      data={historicalData.map(item => ({
                        ...item,
                        high: typeof item.high === 'object' && item.high !== null 
                          ? (item.high.toString ? item.high.toString() : JSON.stringify(item.high))
                          : item.high
                      }))}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      stroke="#ffc658" 
                      name="Low"
                      data={historicalData.map(item => ({
                        ...item,
                        low: typeof item.low === 'object' && item.low !== null 
                          ? (item.low.toString ? item.low.toString() : JSON.stringify(item.low))
                          : item.low
                      }))}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div>No historical data available</div>
              )}
            </div>
          )}
        </div>
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
            <li style={{ margin: '1rem 0' }}><Link to="/positions" style={{ color: '#fff', textDecoration: 'none' }}>Positions</Link></li>
            <li style={{ margin: '1rem 0' }}><Link to="/statistics" style={{ color: '#fff', textDecoration: 'none' }}>Statistics</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, background: '#282c34', color: '#fff', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
