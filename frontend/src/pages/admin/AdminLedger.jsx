import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, TrendingUp, Users, ArrowRight, 
  Calendar, RotateCcw, AlertCircle, CheckCircle2 
} from 'lucide-react';

const AdminLedger = () => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [sumRes, histRes] = await Promise.all([
        axios.get('http://localhost:8000/ledger/summary', { headers }),
        axios.get('http://localhost:8000/ledger/history', { headers })
      ]);
      setSummary(sumRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error("Failed to fetch ledger data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Processing financial data...</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="header-title" style={{ marginBottom: '24px' }}>Platform Ledger & Earnings</h2>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4" style={{ gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4F46E5, #3730A3)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p style={{ opacity: 0.8, fontSize: '13px', fontWeight: 500 }}>Total Platform Revenue</p>
              <h3 style={{ fontSize: '24px', margin: 0 }}>₹{summary?.total_revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '10px', background: '#FEF3C7', color: '#B45309', borderRadius: '10px' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '13px', fontWeight: 500 }}>Total Bookings</p>
              <h3 style={{ fontSize: '24px', margin: 0 }}>{summary?.total_bookings}</h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'white', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '10px', background: '#D1FAE5', color: '#059669', borderRadius: '10px' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--gray)', fontSize: '13px', fontWeight: 500 }}>Top Agent Share</p>
              <h3 style={{ fontSize: '24px', margin: 0 }}>₹{summary?.by_agent[0]?.total_earnings.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics Sections ── */}
      <div className="grid grid-cols-3" style={{ gap: '24px', marginBottom: '32px' }}>
        {/* Earnings by Agent */}
        <div className="card">
          <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '20px' }}>Earnings by Agent</h3>
          <div className="table-container">
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Agent Name</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary?.by_agent.map(stat => (
                  <tr key={stat.id}>
                    <td>{stat.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{stat.total_earnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings by Route */}
        <div className="card">
          <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '20px' }}>Best Performing Routes</h3>
          <div className="table-container">
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Route</th>
                  <th style={{ textAlign: 'right' }}>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {summary?.by_route.map(stat => (
                  <tr key={stat.id}>
                    <td>{stat.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{stat.total_earnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings by Bus */}
        <div className="card">
          <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '20px' }}>Top Performing Buses</h3>
          <div className="table-container">
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Bus Unit</th>
                  <th style={{ textAlign: 'right' }}>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {summary?.by_bus.map(stat => (
                  <tr key={stat.id}>
                    <td>{stat.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{stat.total_earnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="card">
        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Latest Transactions</h3>
        <div className="table-container">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td>#BK-{item.booking_id}</td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: item.entry_type === 'CREDIT' ? '#DCFCE7' : '#FEE2E2',
                      color: item.entry_type === 'CREDIT' ? '#166534' : '#991B1B'
                    }}>
                      {item.entry_type === 'CREDIT' ? <DollarSign size={12}/> : <RotateCcw size={12}/>}
                      {item.entry_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: item.entry_type === 'CREDIT' ? '#059669' : '#DC2626' }}>
                    {item.entry_type === 'CREDIT' ? '+' : ''}₹{item.amount.toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--gray)', fontSize: '13px' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.entry_type === 'CREDIT' ? 
                      <CheckCircle2 size={18} className="text-success" /> : 
                      <AlertCircle size={18} className="text-danger" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLedger;
