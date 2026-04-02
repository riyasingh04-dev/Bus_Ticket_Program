import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Bus, Ticket, Headphones, LogOut, User } from 'lucide-react';

const UserLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="user-layout">
      {/* ── Top Navbar ── */}
      <nav className="user-navbar">
        {/* Brand */}
        <Link to="/user" className="user-navbar-brand">
          <div className="user-navbar-logo">
            <Bus size={20} />
          </div>
          <span>ExpressBus</span>
        </Link>

        {/* Nav Links */}
        <ul className="user-navbar-links">
          <li>
            <Link
              to="/user"
              className={location.pathname === '/user' ? 'active' : ''}
            >
              <Bus size={16} />
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/user/bookings"
              className={isActive('/user/bookings') ? 'active' : ''}
            >
              <Ticket size={16} />
              My Bookings
            </Link>
          </li>
          <li>
            <a href="mailto:support@expressbus.in">
              <Headphones size={16} />
              Support
            </a>
          </li>
        </ul>

        {/* Actions */}
        <div className="user-navbar-actions">
          <div className="user-avatar-btn" title={user?.name || user?.email}>
            <User size={18} />
          </div>
          <button className="user-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="user-main">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
