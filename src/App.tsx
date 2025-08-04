import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TradeDetailsPage from './TradeDetailsPage';

interface Contract {
  conid: string;
  symbol: string;
  exchange?: string | null;
  currency?: string;
  description?: string;
  // Add other contract fields as needed
}

interface HistoricalData {
  id: number;
  position: Position;
  timestamp?: string;
  timeframe?: string;
  open?: any; // BigDecimal from Java
  high?: any; // BigDecimal from Java
  low?: any; // BigDecimal from Java
  close?: any; // BigDecimal from Java
  volume?: number;
  count?: number;
  wap?: any; // BigDecimal from Java
  createdAt?: string;
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

interface Order {
  orderId: number;
  symbol: string;
  quantity: any; // Backend returns an object
  lmtPrice: number;
  currency: string;
  status: string;
  action: string;
  createdAt?: string; // Optional, may not be present
}

function Home() {
  const [accounts, setAccounts] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:8081/accounts');
        setAccounts(res.data);
      } catch (err: any) {
        setError('Failed to fetch account info');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div>
      <h2>Welcome to the Home page!</h2>
      <h3>Account Information</h3>
      {loading ? (
        <div>Loading account info...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : accounts && Object.keys(accounts).length > 0 ? (
        <table style={{ background: '#222', color: '#fff', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #444', padding: 8 }}>Key</th>
              <th style={{ border: '1px solid #444', padding: 8 }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(accounts).map(([key, value]) => (
              <tr key={key}>
                <td style={{ border: '1px solid #444', padding: 8 }}>{key}</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No account info available.</div>
      )}
    </div>
  );
}

function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', avgPrice: '' });
  const [submitting, setSubmitting] = useState(false);
  const [contractQuery, setContractQuery] = useState('');
  const [contractResults, setContractResults] = useState<Contract[]>([]);
  const [contractSearchLoading, setContractSearchLoading] = useState(false);
  const [contractSearchError, setContractSearchError] = useState<string | null>(null);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:8081/positions');
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

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await axios.get('http://localhost:8081/orders');
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
      if (!Array.isArray(res.data)) {
        setOrdersError('Response from /orders is not an array.');
      }
    } catch (err: any) {
      setOrdersError('Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('http://localhost:8081/positions', {
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

  const handleContractSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractSearchLoading(true);
    setContractSearchError(null);
    setShowAllContracts(false);
    try {
      const res = await axios.get('http://localhost:8081/contracts/search', {
        params: { query: contractQuery }
      });
      setContractResults(Array.isArray(res.data) ? res.data : []);
      if (!Array.isArray(res.data)) {
        setContractSearchError('Response from /contracts/search is not an array.');
      }
    } catch (err: any) {
      setContractSearchError('Failed to search contracts');
    } finally {
      setContractSearchLoading(false);
    }
  };

  const handleContractClick = async (contract: Contract) => {
    try {
      const res = await axios.get('http://localhost:8081/contracts/market-data', {
        params: { conid: contract.conid }
      });
      console.log('Market data response:', res.data);
      
      // Navigate to market data page with contract and market data
      navigate('/market-data', { 
        state: { 
          contract, 
          marketData: res.data 
        } 
      });
    } catch (err: any) {
      console.error('Failed to fetch market data:', err);
      // Navigate to error page or show error in current page
      navigate('/market-data', { 
        state: { 
          contract, 
          error: err.message || 'Failed to fetch market data' 
        } 
      });
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchOrders();
  }, []);

  // Fetch orders again when returning to this page
  useEffect(() => {
    fetchOrders();
  }, [location]);

  return (
    <div>
      <h2>Positions</h2>
      {/* Contract Search */}
      <form onSubmit={handleContractSearch} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search contracts..."
          value={contractQuery}
          onChange={e => setContractQuery(e.target.value)}
          style={{ padding: '0.5rem', flex: 1 }}
        />
        <button type="submit" disabled={contractSearchLoading} style={{ padding: '0.5rem 1rem' }}>
          {contractSearchLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {contractSearchError && <div style={{ color: 'red', marginBottom: 8 }}>{contractSearchError}</div>}
      {contractResults.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #444', padding: 8 }}>Symbol</th>
                <th style={{ border: '1px solid #444', padding: 8 }}>Exchange</th>
                <th style={{ border: '1px solid #444', padding: 8 }}>Currency</th>
                <th style={{ border: '1px solid #444', padding: 8 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {(showAllContracts ? contractResults : contractResults.slice(0, 5)).map(contract => (
                <tr 
                  key={contract.conid}
                  onClick={() => handleContractClick(contract)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.symbol}</td>
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.exchange ?? 'N/A'}</td>
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.currency}</td>
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contractResults.length > 5 && !showAllContracts && (
            <button 
              onClick={() => setShowAllContracts(true)}
              style={{ 
                marginTop: '8px', 
                padding: '8px 16px', 
                background: '#61dafb', 
                color: '#000', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Show All ({contractResults.length} total)
            </button>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3>Positions</h3>
          {loading ? (
            <div>Loading positions...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : (
            <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Symbol</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Sec Type</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Exchange</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Currency</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Quantity</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position, idx) => {
                  // Assign a color from a palette based on index
                  const colors = ['#222', '#2a3d4f', '#3d2a4f', '#4f2a2a', '#2a4f3d', '#4f4f2a'];
                  const bgColor = colors[idx % colors.length];
                  return (
                    <tr
                      key={position.conid}
                      onClick={() => navigate('/trade-details', { state: { position } })}
                      style={{ cursor: 'pointer', backgroundColor: bgColor }}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Orders</h3>
          {ordersLoading ? (
            <div>Loading orders...</div>
          ) : ordersError ? (
            <div style={{ color: 'red' }}>{ordersError}</div>
          ) : (
            <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Symbol</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Quantity</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Action</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Price</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Status</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Currency</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  // Assign a color from a palette based on index
                  const colors = ['#222', '#2a3d4f', '#3d2a4f', '#4f2a2a', '#2a4f3d', '#4f4f2a'];
                  const bgColor = colors[idx % colors.length];
                  return (
                    <tr key={order.orderId} style={{ backgroundColor: bgColor }}>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{order.symbol}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>
                        {typeof order.quantity === 'object' && order.quantity !== null
                          ? JSON.stringify(order.quantity)
                          : order.quantity}
                      </td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{order.action}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{order.lmtPrice}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{order.status}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{order.currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Statistics() {
  return <div>Statistics will be shown here.</div>;
}

function MarketDataPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { contract, marketData, error } = location.state || {};

  if (!contract) {
    return (
      <div>
        <h2>Market Data</h2>
        <div style={{ color: 'red' }}>No contract data available.</div>
        <button 
          onClick={() => navigate('/positions')}
          style={{ 
            marginTop: '1rem', 
            padding: '8px 16px', 
            background: '#61dafb', 
            color: '#000', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Positions
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Market Data - {contract.symbol}</h2>
        <button 
          onClick={() => navigate('/positions')}
          style={{ 
            padding: '8px 16px', 
            background: '#61dafb', 
            color: '#000', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Positions
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3>Contract Information</h3>
          <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Symbol</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.symbol}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Contract ID</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.conid}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Exchange</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.exchange || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Currency</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.currency || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Description</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.description || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Market Data</h3>
          {error ? (
            <div style={{ 
              color: '#ff6b6b', 
              background: '#4a2a2a', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid #ff6b6b' 
            }}>
              <h4>Error Loading Market Data</h4>
              <p>{error}</p>
            </div>
          ) : marketData ? (
            <div style={{ background: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
              {Object.entries(marketData).map(([key, value]) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0', 
                  borderBottom: '1px solid #444' 
                }}>
                  <span style={{ fontWeight: 'bold', color: '#61dafb' }}>{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#61dafb', textAlign: 'center', padding: '20px' }}>
              Loading market data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
            <Route path="/trade-details" element={<TradeDetailsPage />} />
            <Route path="/market-data" element={<MarketDataPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
