import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Users, Bus, Map, Ticket, Settings } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>ExpressBus</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span className="role-badge">{user?.role}</span>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--gray-light)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
            {user?.name || 'Logged In'}
          </p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {user?.role === 'admin' && (
              <>
                <li>
                  <Link to="/admin"><LayoutDashboard size={20} /> Dashboard</Link>
                </li>
                <li>
                  <Link to="/admin/agents"><Users size={20} /> Manage Agents</Link>
                </li>
                <li>
                  <Link to="/admin/ledger"><Ticket size={20} /> Ledger & Earnings</Link>
                </li>
                <li>
                  <Link to="/admin/masters"><Settings size={20} /> Master Data</Link>
                </li>
              </>
            )}

            {user?.role === 'agent' && (
              <>
                <li>
                  <Link to="/agent"><LayoutDashboard size={20} /> Dashboard</Link>
                </li>
                <li>
                  <Link to="/agent/buses"><Bus size={20} /> Manage Buses</Link>
                </li>
                <li>
                  <Link to="/agent/routes"><Map size={20} /> Manage Routes</Link>
                </li>
              </>
            )}

            {user?.role === 'user' && (
              <>
                <li>
                  <Link to="/user"><LayoutDashboard size={20} /> Dashboard</Link>
                </li>
                <li>
                  <Link to="/user/search"><Bus size={20} /> Search Buses</Link>
                </li>
                <li>
                  <Link to="/user/bookings"><Ticket size={20} /> My Bookings</Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
