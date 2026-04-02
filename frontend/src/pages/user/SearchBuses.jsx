import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import {
  Search, MapPin, ArrowLeftRight, ArrowRight, Bus,
  Wind, Moon, Clock, ChevronLeft, AlertCircle
} from 'lucide-react';

const SearchBuses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [cities, setCities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get('http://localhost:8000/masters/cities');
        setCities(res.data);
        
        // If we have names in params, try to map to IDs for the dropdowns
        const srcCity = res.data.find(c => c.name === searchParams.get('source'));
        const destCity = res.data.find(c => c.name === searchParams.get('destination'));
        if (srcCity) setSource(srcCity.id);
        if (destCity) setDestination(destCity.id);
        
        if (searchParams.get('source') && searchParams.get('destination')) {
          doSearch(searchParams.get('source'), searchParams.get('destination'));
        }
      } catch (err) {
        console.error("Failed to load cities");
      }
    };
    fetchCities();
  }, []);

  const doSearch = async (srcName, destName) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/routes/schedule/search?source=${encodeURIComponent(srcName)}&destination=${encodeURIComponent(destName)}`
      );
      setSchedules(res.data);
    } catch {
      setSchedules([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const srcName = cities.find(c => String(c.id) === String(source))?.name || '';
    const destName = cities.find(c => String(c.id) === String(destination))?.name || '';
    if (srcName && destName) {
      doSearch(srcName, destName);
    }
  };

  const handleSwap = () => {
    const tmp = source;
    setSource(destination);
    setDestination(tmp);
  };

  const handleSelectBus = (sch) => {
    navigate(`/user/book/${sch.id}`, { state: { schedule: sch } });
  };

  return (
    <div className="animate-fade-in">
      {/* ── Small Hero ── */}
      <section className="hero-section hero-sm">
        <h1 className="hero-title" style={{ fontSize: '36px' }}>Find Your Bus</h1>
        <p className="hero-subtitle">
          {searched && !loading
            ? `${schedules.length} bus${schedules.length !== 1 ? 'es' : ''} found`
            : 'Explore schedules on our premium network'}
        </p>
      </section>

      {/* ── Inline Search ── */}
      <div className="search-card-wrapper" style={{ marginBottom: '12px' }}>
        <div className="search-card" style={{ padding: '24px 32px' }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect 
                  label="Departure"
                  placeholder="From..."
                  options={cities}
                  value={source}
                  onChange={setSource}
                />
              </div>
              <div style={{ paddingBottom: '23px' }}>
                <button type="button" className="sc-swap-btn" onClick={handleSwap}>
                  <ArrowLeftRight size={16} />
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <SearchableSelect 
                  label="Destination"
                  placeholder="To..."
                  options={cities}
                  value={destination}
                  onChange={setDestination}
                />
              </div>
              <button
                type="submit" className="sc-search-btn"
                style={{ flex: 0, width: 'auto', padding: '12px 24px', whiteSpace: 'nowrap', height: '44px', marginBottom: '10px' }}
                disabled={loading || !source || !destination}
              >
                {loading ? 'Searching...' : <><Search size={16} /> Search</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="results-section">
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <p>Searching best buses for you…</p>
          </div>
        )}

        {!loading && searched && schedules.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Bus size={36} /></div>
            <h3>No buses found</h3>
            <p>We couldn't find any schedules for this route today.</p>
            <button className="btn-primary" onClick={() => navigate('/user')}>
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && schedules.map((sch, i) => (
          <div key={sch.id} className="bus-card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="bus-card-left">
              <div className="bus-card-route">
                <span className="bus-card-city">{sch.route?.source_city?.name}</span>
                <ArrowRight size={20} style={{ color: 'var(--gray-light)' }} />
                <span className="bus-card-city">{sch.route?.destination_city?.name}</span>
              </div>
              <div className="bus-card-meta">
                <span className="bus-badge"><Bus size={12} />{sch.bus?.name}</span>
                {sch.bus?.is_ac && <span className="bus-badge ac"><Wind size={12} /> AC</span>}
                {sch.bus?.bus_type?.name && <span className="bus-badge sleeper"><Moon size={12} />{sch.bus?.bus_type?.name}</span>}
                <span className="bus-badge time">
                  <Clock size={12} />
                  {new Date(sch.departure_time).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <div className="bus-card-right">
              <div className="bus-price">₹{sch.price}</div>
              <div className="bus-price-label">per seat</div>
              <button className="btn-book" onClick={() => handleSelectBus(sch)}>
                Select &amp; Book
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBuses;
