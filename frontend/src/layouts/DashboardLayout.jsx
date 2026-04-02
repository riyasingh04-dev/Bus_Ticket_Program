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
        <div className="sidebar-header">
          <h2>ExpressBus</h2>
          <span className="role-badge">{user?.role}</span>
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
