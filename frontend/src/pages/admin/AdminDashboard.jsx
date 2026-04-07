import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Users, AlertTriangle, User as UserIcon } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total_agents: 0, total_revenue: 0, total_bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/analytics/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Calculating platform metrics...</div>;

  return (
    <div className="card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="header-title" style={{ margin: 0 }}>System Performance Overview</h2>
      </div>
      
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        {/* Total Agents */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Users size={32} />
            <div>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>Active Transport Agents</p>
              <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.total_agents}</h3>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #4F46E5, #3730A3)', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>Platform Revenue</p>
              <h3 style={{ margin: 0, fontSize: '28px' }}>₹{stats.total_revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>Confirmed Bookings</p>
              <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.total_bookings}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
