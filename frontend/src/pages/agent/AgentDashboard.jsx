import React, { useContext, useState, useEffect } from 'react';
import { Bus, Map, Ticket, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const AgentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ bus_count: 0, revenue: 0, active_bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/analytics/agent/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch agent stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading your fleet data...</div>;

  return (
    <div className="card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="header-title" style={{ margin: 0 }}>Fleet Overview</h2>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-3" style={{ gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ background: '#EEF2FF', border: '1px solid #E0E7FF' }}>
          <p style={{ margin: 0, color: '#4338CA', fontSize: '13px', fontWeight: 600 }}>Active Buses</p>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: '#1E1B4B' }}>{stats.bus_count}</h3>
        </div>
        <div className="card" style={{ background: '#ECFDF5', border: '1px solid #D1FAE5' }}>
          <p style={{ margin: 0, color: '#047857', fontSize: '13px', fontWeight: 600 }}>My Earnings</p>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: '#064E3B' }}>₹{stats.revenue.toLocaleString()}</h3>
        </div>
        <div className="card" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5' }}>
          <p style={{ margin: 0, color: '#C2410C', fontSize: '13px', fontWeight: 600 }}>Upcoming Seats</p>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: '#7C2D12' }}>{stats.active_bookings}</h3>
        </div>
      </div>

      <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>Quick Actions</h3>
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        <Link to="/agent/buses" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--primary)', color: 'white', cursor: 'pointer', padding: '20px'}}>
            <Bus size={28} />
            <div>
              <h4 style={{ margin: 0 }}>Manage Buses</h4>
              <p style={{fontSize: '12px', opacity: 0.9, margin: '4px 0 0'}}>Update your fleet</p>
            </div>
          </div>
        </Link>
        <Link to="/agent/routes" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--secondary)', color: 'white', cursor: 'pointer', padding: '20px'}}>
            <Map size={28} />
            <div>
              <h4 style={{ margin: 0 }}>Manage Routes</h4>
              <p style={{fontSize: '12px', opacity: 0.9, margin: '4px 0 0'}}>Set timings & prices</p>
            </div>
          </div>
        </Link>
        <Link to="/agent/seats" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: '#059669', color: 'white', cursor: 'pointer', padding: '20px'}}>
            <Ticket size={28} />
            <div>
              <h4 style={{ margin: 0 }}>Occupancy</h4>
              <p style={{fontSize: '12px', opacity: 0.9, margin: '4px 0 0'}}>Track actual seats</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AgentDashboard;
