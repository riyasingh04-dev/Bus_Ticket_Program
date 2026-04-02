import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import {
  MapPin, ArrowLeftRight, Calendar, Bus,
  Search, TrendingUp, ArrowRight, Zap, Shield, Clock, Flame, AlertTriangle
} from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [busType, setBusType] = useState('');
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, citiesRes] = await Promise.all([
          axios.get('http://localhost:8000/routes/popular?limit=6'),
          axios.get('http://localhost:8000/masters/cities')
        ]);
        setPopularRoutes(routesRes.data);
        setCities(citiesRes.data);
      } catch {
        setPopularRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const srcName = cities.find(c => String(c.id) === String(source))?.name || '';
    const destName = cities.find(c => String(c.id) === String(destination))?.name || '';
    
    if (!srcName || !destName) return;

    navigate(`/user/search?source=${encodeURIComponent(srcName)}&destination=${encodeURIComponent(destName)}`);
  };

  const handleRouteClick = (route) => {
    navigate(`/user/search?source=${encodeURIComponent(route.source)}&destination=${encodeURIComponent(route.destination)}`);
  };

  return (
    <div className="animate-fade-in">
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-badge"><Zap size={13} /> 10,000+ Routes Available</div>
        <h1 className="hero-title">Book Bus Tickets</h1>
        <p className="hero-subtitle">Travel comfortably across validated routes nationwide</p>
      </section>

      {/* ── Search Card ── */}
      <div className="search-card-wrapper">
        <div className="search-card">
          <form onSubmit={handleSearch}>
            <div className="search-card-row">
              <div style={{ flex: 1 }}>
                <SearchableSelect 
                  label="From City" 
                  options={cities} 
                  placeholder="Select Departure"
                  value={source}
                  onChange={setSource}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '23px' }}>
                <button type="button" className="sc-swap-btn" onClick={handleSwap} title="Swap cities">
                  <ArrowLeftRight size={16} />
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <SearchableSelect 
                  label="To City" 
                  options={cities} 
                  placeholder="Select Destination"
                  value={destination}
                  onChange={setDestination}
                />
              </div>
            </div>
            
            <div className="search-card-row-2">
              <div className="sc-field">
                <label><Calendar size={13} /> Departure Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="sc-field">
                <label><Bus size={13} /> Service Class</label>
                <select value={busType} onChange={e => setBusType(e.target.value)}>
                  <option value="">Any bus type</option>
                  <option value="sleeper">Premium Sleeper</option>
                  <option value="ac">Luxury AC</option>
                  <option value="non-ac">Express Non-AC</option>
                </select>
              </div>
            </div>
            <button type="submit" className="sc-search-btn" disabled={!source || !destination}>
              <Search size={18} /> Find Available Buses
            </button>
          </form>
        </div>
      </div>

      {/* ── Features Strip ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', padding: '40px 40px 0', flexWrap: 'wrap' }}>
        {[
          { icon: <Shield size={18} />, label: 'Safe & Secure Payments' },
          { icon: <Clock size={18} />, label: 'Real-time Seat Tracking' },
          { icon: <Zap size={18} />, label: 'Instant Confirmation' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray)', fontSize: '14px', fontWeight: 500 }}>
            <span style={{ color: 'var(--primary)' }}>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>

      {/* ── Popular Routes ── */}
      <section className="popular-routes-section">
        <h2 className="section-title">
          <TrendingUp size={22} /> Popular Routes
        </h2>

        {routesLoading ? (
          <div className="routes-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ height: '100px', animation: 'pulse 1.5s infinite', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : popularRoutes.length === 0 ? (
          <div className="empty-state" style={{ background: 'white' }}>
            <p>No popular routes found yet.</p>
          </div>
        ) : (
          <div className="routes-grid">
            {popularRoutes.map((route) => (
              <div key={route.route_id} className="route-card" onClick={() => handleRouteClick(route)}>
                <div className="route-card-left">
                  <h4>
                    {route.source} <ArrowRight size={14} className="text-gray-light" /> {route.destination}
                    {route.is_trending && <span className="badge-trending"><Flame size={11} /> Hot</span>}
                  </h4>
                  <p>{route.booking_count} recent bookings</p>
                </div>
                <div className="route-card-price">
                  <strong>₹{route.min_price}</strong>
                  <span>onwards</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDashboard;
