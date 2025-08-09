import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import TradeDetailsPage from './TradeDetailsPage';

interface Contract {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

// Removed unused HistoricalData interface

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

interface MarketStatus {
  exchange: string;
  holiday: string | null;
  isOpen: boolean;
  session: string;
  timezone: string;
}

function Home() {
  const [accounts, setAccounts] = useState<Record<string, string> | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [marketStatusLoading, setMarketStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketStatusError, setMarketStatusError] = useState<string | null>(null);

  const fetchMarketStatus = async () => {
    setMarketStatusLoading(true);
    setMarketStatusError(null);
    try {
      const res = await axios.get('http://localhost:8081/trades/status');
      setMarketStatus(res.data);
    } catch (err: any) {
      setMarketStatusError('Failed to fetch market status');
    } finally {
      setMarketStatusLoading(false);
    }
  };

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
    fetchMarketStatus();
  }, []);

  return (
    <div>
      <h2>Welcome to the Home page!</h2>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
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

        <div style={{ flex: 1 }}>
          <h3>Market Status</h3>
          {marketStatusLoading ? (
            <div>Loading market status...</div>
          ) : marketStatusError ? (
            <div style={{ color: 'red' }}>{marketStatusError}</div>
          ) : marketStatus ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#888' }}>Last updated: {new Date().toLocaleTimeString()}</span>
                <button 
                  onClick={fetchMarketStatus}
                  disabled={marketStatusLoading}
                  style={{ 
                    padding: '4px 8px', 
                    background: '#61dafb', 
                    color: '#000', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {marketStatusLoading ? '↻' : '↻'} Refresh
                </button>
              </div>
              <table style={{ background: '#222', color: '#fff', borderCollapse: 'collapse', marginTop: 16 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #444', padding: 8 }}>Field</th>
                    <th style={{ border: '1px solid #444', padding: 8 }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Exchange</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{marketStatus.exchange}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Holiday</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{marketStatus.holiday || 'None'}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Is Open</td>
                    <td style={{ 
                      border: '1px solid #444', 
                      padding: 8, 
                      color: marketStatus.isOpen ? '#4caf50' : '#f44336',
                      fontWeight: 'bold'
                    }}>
                      {marketStatus.isOpen ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Session</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{marketStatus.session}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Timezone</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{marketStatus.timezone}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div>No market status available.</div>
          )}
        </div>
      </div>
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
  // Removed unused form state
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

  // Removed unused form handlers

  const handleContractSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractSearchLoading(true);
    setContractSearchError(null);
    setShowAllContracts(false);
    try {
      const res = await axios.get('http://localhost:8081/trades/search', {
        params: { symbol: contractQuery }
      });
      
      // Handle the new response format with count and result fields
      if (res.data && res.data.result && Array.isArray(res.data.result)) {
        setContractResults(res.data.result);
      } else {
        setContractResults([]);
        setContractSearchError('Invalid response format from /trades/search');
      }
    } catch (err: any) {
      setContractSearchError('Failed to search trades');
    } finally {
      setContractSearchLoading(false);
    }
  };

  const handleContractClick = async (contract: Contract) => {
    console.log('handleContractClick called for', contract.symbol);
    try {
      // Check market status first; subscribe only if market is open
      let isOpen = false;
      try {
        const statusRes = await axios.get('http://localhost:8081/trades/status');
        isOpen = !!statusRes.data?.isOpen;
      } catch (statusErr) {
        // If status check fails, default to not open; MarketDataPage will handle fallback
        isOpen = false;
      }

      if (isOpen) {
        console.log('Market open: POST /trades/subscribe/' + contract.symbol);
        await axios.post(`http://localhost:8081/trades/subscribe/${contract.symbol}`);
        console.log('POST /trades/subscribe successful');
      } else {
        console.log('Market closed: skip subscribe, will use quote polling');
      }

      navigate('/market-data', {
        state: {
          contract,
          symbol: contract.symbol,
          marketWasOpenAtNav: isOpen
        }
      });
    } catch (err: any) {
      console.error('Failed to subscribe to market data:', err);
      navigate('/market-data', { 
        state: { 
          contract, 
          error: err.message || 'Failed to subscribe to market data' 
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
                <th style={{ border: '1px solid #444', padding: 8 }}>Display Symbol</th>
                <th style={{ border: '1px solid #444', padding: 8 }}>Type</th>
                <th style={{ border: '1px solid #444', padding: 8 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {(showAllContracts ? contractResults : contractResults.slice(0, 5)).map(contract => (
                <tr 
                  key={contract.symbol}
                  onClick={() => handleContractClick(contract)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.symbol}</td>
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.displaySymbol}</td>
                  <td style={{ border: '1px solid #444', padding: 8 }}>{contract.type}</td>
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
  const { contract: locationContract, symbol: locationSymbol, error: locationError, marketWasOpenAtNav } = location.state || {};

  const [tradeData, setTradeData] = useState<any[]>([]);
  const [error, setError] = useState(locationError || null);
  const [loading, setLoading] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState<boolean>(!!marketWasOpenAtNav);

  const eventSourceRef = useRef<EventSource | null>(null);
  const statusIntervalRef = useRef<number | null>(null);

  const contract = locationContract;
  const symbol = locationSymbol || (contract && contract.symbol);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;

    const closeEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const clearStatusInterval = () => {
      if (statusIntervalRef.current !== null) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    };

    const startStreaming = async () => {
      closeEventSource();
      setLoading(true);
      setError(null);
      setTradeData([]);

      // Ensure we are subscribed
      if (!hasSubscribed) {
        try {
          await axios.post(`http://localhost:8081/trades/subscribe/${symbol}`);
          if (isMounted) setHasSubscribed(true);
        } catch (subscribeErr: any) {
          if (isMounted) setError('Failed to subscribe to market data');
          return;
        }
      }

      const es = new EventSource('http://localhost:8081/trades/stream');
      eventSourceRef.current = es;
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.s === symbol) {
            setTradeData(prev => [data, ...prev.slice(0, 49)]);
          }
        } catch (_) {
          // ignore
        }
      };
      es.onerror = () => {
        setError('Error receiving market data stream');
        closeEventSource();
      };
      setLoading(false);
    };

    const fetchQuoteOnce = async () => {
      try {
        const res = await axios.get('http://localhost:8081/trades/quote', { params: { symbol: symbol } });
        const q = res.data || {};
        const mapped = {
          t: q.t || q.timestamp || Date.now(),
          c: q.c ?? q.price ?? q.last ?? q.close ?? null,
          v: q.v ?? q.volume ?? q.size ?? null,
          s: symbol
        } as any;
        setTradeData([mapped]);
        setError(null);
      } catch (e: any) {
        setError('Failed to fetch quote');
      }
    };

    const fetchMarketStatus = async (): Promise<boolean | null> => {
      try {
        const res = await axios.get('http://localhost:8081/trades/status');
        return !!res.data?.isOpen;
      } catch (_) {
        return null;
      }
    };

    const decideAndStart = async () => {
      const open = await fetchMarketStatus();
      if (open) {
        startStreaming();
      } else {
        // Market is closed: single quote fetch (no repeat polling)
        setLoading(false);
        fetchQuoteOnce();
      }
    };

    decideAndStart();

    // Periodically check market status (every minute). If it opens, subscribe and start streaming.
    statusIntervalRef.current = window.setInterval(async () => {
      const open = await fetchMarketStatus();
      if (open === true && !eventSourceRef.current) {
        await startStreaming();
        // Stop checking once open and streaming
        clearStatusInterval();
      }
    }, 60000);

    return () => {
      isMounted = false;
      closeEventSource();
      clearStatusInterval();
    };
  }, [symbol, hasSubscribed]);

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
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Display Symbol</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.displaySymbol}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Type</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.type}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #444', padding: 8, fontWeight: 'bold', color: '#61dafb' }}>Description</td>
                <td style={{ border: '1px solid #444', padding: 8 }}>{contract.description}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Live Trade Data</h3>
          {error ? (
            <div style={{ color: '#ff6b6b', background: '#4a2a2a', padding: '15px', borderRadius: '8px', border: '1px solid #ff6b6b' }}>
              <h4>Error Loading Market Data</h4>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div style={{ color: '#61dafb', textAlign: 'center', padding: '20px' }}>
              Loading market data...
            </div>
          ) : (
            <table style={{ width: '100%', background: '#222', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Time</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Price</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {tradeData.map((trade, idx) => (
                  <tr key={trade.t + '-' + idx}>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{new Date(trade.t).toLocaleTimeString()}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{trade.c}</td>
                    <td style={{ border: '1px solid #444', padding: 8 }}>{trade.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
