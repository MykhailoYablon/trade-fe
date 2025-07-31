import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Position {
  id?: number;
  conid: string;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
  quantity: any;
  avgPrice: any;
  updatedAt: string;
}

interface HistoricalData {
  id: number;
  position: Position;
  timestamp?: string;
  timeframe?: string;
  open?: any;
  high?: any;
  low?: any;
  close?: any;
  volume?: number;
  count?: number;
  wap?: any;
  createdAt?: string;
}

export default function TradeDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const position = (location.state as { position: Position })?.position;
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('FIVE_MIN');
  const [days, setDays] = useState(7);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: position?.symbol || '', quantity: '', avgPrice: '', action: 'BUY' });
  const [submitting, setSubmitting] = useState(false);

  // Function to get the latest low price from historical data
  const getLatestLowPrice = (): string => {
    if (historicalData.length === 0) return '';
    // Sort by timestamp to get the most recent data
    const sortedData = [...historicalData].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA; // Descending order to get latest first
    });
    const latestData = sortedData[0];
    return latestData.low ? latestData.low.toString() : '';
  };

  // Function to reset form with latest data
  const resetForm = () => {
    setForm({ 
      symbol: position?.symbol || '', 
      quantity: '', 
      avgPrice: getLatestLowPrice(),
      action: 'BUY'
    });
  };

  useEffect(() => {
    if (position) fetchHistoricalData(position.conid, timeframe, days);
    // eslint-disable-next-line
  }, [position]);

  const fetchHistoricalData = async (conid: string, selectedTimeframe: string = timeframe, selectedDays: number = days) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:8080/positions/${conid}/historical/${selectedTimeframe}?days=${selectedDays}`);
      
      // Sort the data by timestamp to ensure proper chronological order
      const sortedData = res.data.sort((a: HistoricalData, b: HistoricalData) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB; // Ascending order for chronological display
      });
      
      console.log(`Fetched ${sortedData.length} data points for ${selectedDays} days`);
      if (sortedData.length > 0) {
        const firstDate = new Date(sortedData[0].timestamp || '');
        const lastDate = new Date(sortedData[sortedData.length - 1].timestamp || '');
        console.log(`Date range: ${firstDate.toISOString()} to ${lastDate.toISOString()}`);
      }
      
      setHistoricalData(sortedData);
      // Update form with latest low price when historical data is loaded
      if (sortedData.length > 0) {
        setForm(prev => ({ ...prev, avgPrice: getLatestLowPrice() }));
      }
    } catch (err: any) {
      setError('Failed to fetch historical data');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (position) fetchHistoricalData(position.conid, newTimeframe, days);
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    if (position) fetchHistoricalData(position.conid, timeframe, newDays);
  };

  const calculateYAxisDomain = (data: HistoricalData[]) => {
    if (!data || data.length === 0) return [0, 100];
    const prices = data.flatMap(item => [item.close, item.high, item.low, item.open].filter(price => price !== null && price !== undefined));
    if (prices.length === 0) return [0, 100];
    const numericPrices = prices.map(price => typeof price === 'object' && price !== null ? parseFloat(price.toString()) : parseFloat(price)).filter(price => !isNaN(price));
    if (numericPrices.length === 0) return [0, 100];
    const minPrice = Math.min(...numericPrices);
    const maxPrice = Math.max(...numericPrices);
    const range = maxPrice - minPrice;
    const padding = range * 0.05;
    const domainMin = Math.max(0, minPrice - padding);
    const domainMax = maxPrice + padding;
    return [domainMin, domainMax];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('http://localhost:8080/orders', null, {
        params: {
          conid: position.conid,
          quantity: Number(form.quantity),
          price: Number(form.avgPrice),
          action: form.action,
        }
      });
      setShowForm(false);
      resetForm();
      alert('Order placed!');
    } catch (err: any) {
      setError('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to format timestamp for X-axis display
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!position) return <div>No position selected.</div>;

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#282c34', color: '#fff', position: 'fixed', top: 0, left: 0, zIndex: 10, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#20232a', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 0 }}>Back</button>
        <h2 style={{ margin: 0 }}>Trade Details for {position.symbol}</h2>
        <button onClick={() => setShowForm(true)} style={{ marginLeft: 'auto' }}>Place Limit Order</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '1rem auto', background: '#222', padding: 16, borderRadius: 8, width: 320 }}>
          <div style={{ marginBottom: 8 }}>
            <input name="symbol" placeholder="Symbol" value={form.symbol} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input name="avgPrice" type="number" step="0.01" placeholder="Limit Price" value={form.avgPrice} onChange={handleInputChange} required />
          </div>
          <div style={{ marginBottom: 8 }}>
            <select 
              name="action" 
              value={form.action} 
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
              required
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <button type="submit" disabled={submitting}>Submit</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      )}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '0 1rem', marginBottom: 8 }}>
        <div>
          <label style={{ marginRight: 8 }}>Timeframe:</label>
          <select 
            value={timeframe} 
            onChange={(e) => handleTimeframeChange(e.target.value)}
            style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555' }}
          >
            <option value="ONE_MIN">1 min</option>
            <option value="THREE_MIN">3 mins</option>
            <option value="FIVE_MIN">5 mins</option>
            <option value="FIFTEEN_MIN">15 mins</option>
            <option value="THIRTY_MIN">30 mins</option>
            <option value="ONE_HOUR">1 hour</option>
            <option value="ONE_DAY">1 day</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: 8 }}>Days:</label>
          <select 
            value={days} 
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555' }}
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
        {loadingHistory ? (
          <div>Loading historical data...</div>
        ) : historicalData.length > 0 ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '8px', borderRadius: '4px', fontSize: '12px', zIndex: 1 }}>
              Data points: {historicalData.length} | 
              Date range: {historicalData.length > 0 ? 
                `${new Date(historicalData[0].timestamp || '').toLocaleDateString()} - ${new Date(historicalData[historicalData.length - 1].timestamp || '').toLocaleDateString()}` : 
                'N/A'
              }
            </div>
                      <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={historicalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={calculateYAxisDomain(historicalData)}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip 
                  formatter={(value: any) => [typeof value === 'object' ? value.toString() : value, '']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#8884d8" 
                  name="Close Price"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#82ca9d" 
                  name="High"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#ffc658" 
                  name="Low"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div>No historical data available</div>
        )}
      </div>
    </div>
  );
} 