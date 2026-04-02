import React from 'react';
import { Bus, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

const AgentDashboard = () => {
  return (
    <div className="card">
      <h2 className="header-title">Agent Dashboard Overview</h2>
      <div className="grid grid-cols-2">
        <Link to="/agent/buses" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--primary)', color: 'white', cursor: 'pointer'}}>
            <Bus size={32} />
            <div>
              <h3>Manage Buses</h3>
              <p style={{fontSize: '14px', opacity: 0.9}}>Add or update your fleet</p>
            </div>
          </div>
        </Link>
        <Link to="/agent/routes" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--secondary)', color: 'white', cursor: 'pointer'}}>
            <Map size={32} />
            <div>
              <h3>Manage Schedules</h3>
              <p style={{fontSize: '14px', opacity: 0.9}}>Set timings and prices</p>
            </div>
          </div>
        </Link>
        <Link to="/agent/seats" style={{textDecoration: 'none'}}>
          <div className="card" style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--success)', color: 'white', cursor: 'pointer'}}>
            <Bus size={32} />
            <div>
              <h3>Seat Management</h3>
              <p style={{fontSize: '14px', opacity: 0.9}}>Real-time occupancy tracker</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AgentDashboard;
