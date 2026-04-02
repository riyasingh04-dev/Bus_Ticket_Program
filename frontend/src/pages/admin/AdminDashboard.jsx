import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalAgents: 0, activeAgents: 0 });

  return (
    <div className="card">
      <h2 className="header-title">Admin Dashboard Overview</h2>
      <div className="grid grid-cols-3">
        <div className="card" style={{background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Users size={32} />
            <div>
              <h3>Total System Overview</h3>
              <p>Manage Agents & System Health</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
