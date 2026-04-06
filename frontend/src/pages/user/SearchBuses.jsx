import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import {
  Search, MapPin, ArrowLeftRight, ArrowRight, Bus,
  Wind, Moon, Clock, Calendar, AlertCircle, CheckCircle, Info
} from 'lucide-react';

const SearchBuses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [travelDate, setTravelDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [locations, setLocations] = useState([]); 
  const [searchResults, setSearchResults] = useState({ results: [], suggestions: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  useEffect(() => {
    const fetchLocations = async () => {
      const token = localStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      try {
        let cities = [];
        try {
          const cRes = await axios.get('http://localhost:8000/masters/cities', authHeader);
          cities = cRes.data || [];
        } catch (e) { console.error("Cities fetch failed", e); }

        let stops = [];
        try {
          const sRes = await axios.get('http://localhost:8000/masters/stops', authHeader);
          stops = sRes.data || [];
        } catch (e) { console.error("Stops fetch failed", e); }
        
        const combined = [
          ...cities.map(c => ({ id: `city-${c.id}`, name: c.name })),
          ...stops.map(s => ({ id: `stop-${s.id}`, name: s.name }))
        ];
        setLocations(combined);
        
        const srcLoc = combined.find(l => l.name === searchParams.get('source'));
        const destLoc = combined.find(l => l.name === searchParams.get('destination'));
        if (srcLoc) setSource(srcLoc.id);
        if (destLoc) setDestination(destLoc.id);
        
        if (searchParams.get('source') && searchParams.get('destination')) {
          doSearch(searchParams.get('source'), searchParams.get('destination'), travelDate);
        }
      } catch (err) {
        console.error("Failed to load locations", err);
      }
    };
    fetchLocations();
  }, [searchParams, travelDate]);
  
  const doSearch = async (srcName, destName, date) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/buses/search?source=${encodeURIComponent(srcName)}&destination=${encodeURIComponent(destName)}&search_date=${date}`
      );
      setSearchResults(res.data);
    } catch {
      setSearchResults({ results: [], suggestions: [] });
    }
    setLoading(false);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    const srcName = locations.find(l => String(l.id) === String(source))?.name || '';
    const destName = locations.find(l => String(l.id) === String(destination))?.name || '';
    if (srcName && destName) {
      setLoading(true);
      setSearched(true);
      doSearch(srcName, destName, travelDate);
    }
  };

  const handleSwap = () => {
    const tmp = source;
    setSource(destination);
    setDestination(tmp);
  };

  const handleSelectBus = async (res) => {
    // 1. Get final date (current travelDate or the next available date)
    const finalDate = res.available ? travelDate : res.next_available_date;
    
    try {
      setLoading(true);
      // 2. Call backend to get or create a fixed schedule for this bus and date
      const scheduleRes = await axios.post('http://localhost:8000/routes/schedule/get-or-create', {
        bus_id: res.bus.id,
        travel_date: finalDate
      });
      
      const schedule = scheduleRes.data;
      
      // 3. Navigate to booking with the real scheduleId
      navigate(`/user/book/${schedule.id}`, { 
        state: { 
          schedule: schedule, 
          date: finalDate 
        } 
      });
    } catch (err) {
      console.error("Failed to prepare schedule", err);
      alert("Something went wrong while preparing your booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderBusCard = (res, i, isSuggestion = false) => {
    const { bus, available, availability_message, next_available_date, pattern_label } = res;
    
    return (
      <div key={bus.id} className={`bus-card animate-fade-up ${!available ? 'unavailable' : ''}`} style={{ animationDelay: `${i * 0.05}s`, marginBottom: '16px' }}>
        <div className="bus-card-left">
          <div className="bus-card-route">
            <span className="bus-card-city">{bus.source || 'Unknown'}</span>
            <ArrowRight size={20} style={{ color: 'var(--gray-light)' }} />
            <span className="bus-card-city">{bus.destination || 'Unknown'}</span>
          </div>
          <div className="bus-card-meta">
            <span className="bus-badge"><Bus size={12} />{bus.name}</span>
            {bus.is_ac && <span className="bus-badge ac"><Wind size={12} /> AC</span>}
            <span className="bus-badge time"><Clock size={12} /> {bus.departure_time || 'N/A'}</span>
            <span className="bus-badge pattern"><Info size={12} /> {pattern_label}</span>
          </div>
          
          {!available && (
            <div className="availability-notice danger">
              <AlertCircle size={14} />
              <span>{availability_message}</span>
            </div>
          )}
          {available && (
            <div className="availability-notice success">
              <CheckCircle size={14} />
              <span>Available on selected date</span>
            </div>
          )}
        </div>
        
        <div className="bus-card-right">
          <div className="bus-price">₹{bus.price || 499}</div>
          <div className="bus-price-label">per seat</div>
          <button 
            className={`btn-book ${!available ? 'btn-secondary' : ''}`} 
            onClick={() => handleSelectBus(res)}
          >
            {available ? 'Select & Book' : 'Book for Next Date'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <section className="hero-section hero-sm">
        <h1 className="hero-title" style={{ fontSize: '36px' }}>Find Your Bus</h1>
        <p className="hero-subtitle">
          {searched && !loading
            ? `${searchResults.results.length} bus${searchResults.results.length !== 1 ? 'es' : ''} found`
            : 'Explore schedules on our premium network'}
        </p>
      </section>

      <div className="search-card-wrapper" style={{ marginBottom: '12px' }}>
        <div className="search-card" style={{ padding: '24px 32px' }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <SearchableSelect 
                  label="Departure"
                  placeholder="From..."
                  options={locations}
                  value={source}
                  onChange={setSource}
                />
              </div>
              <div style={{ paddingBottom: '23px' }}>
                <button type="button" className="sc-swap-btn" onClick={handleSwap}>
                  <ArrowLeftRight size={16} />
                </button>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <SearchableSelect 
                  label="Destination"
                  placeholder="To..."
                  options={locations}
                  value={destination}
                  onChange={setDestination}
                />
              </div>
              <div style={{ flex: '0 0 180px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--gray)', marginBottom: '8px' }}>
                  Travel Date
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="sc-input"
                    style={{ width: '100%', height: '44px', paddingLeft: '40px' }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--gray)' }} />
                </div>
              </div>
              <button
                type="submit" className="sc-search-btn"
                style={{ flex: 1, height: '44px', marginBottom: '0' }}
                disabled={loading || !source || !destination}
              >
                {loading ? 'Searching...' : <><Search size={16} /> Search</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="results-section">
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <p>Searching best buses for you…</p>
          </div>
        )}

        {!loading && searched && searchResults.results.length === 0 && searchResults.suggestions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Bus size={36} /></div>
            <h3>No buses found</h3>
            <p>We couldn't find any buses matching your search criteria.</p>
            <button className="btn-primary" onClick={() => navigate('/user')}>
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && searchResults.results.length > 0 && (
          <div className="results-list">
            <h4 style={{ marginBottom: '16px', color: 'var(--gray)' }}>Available Routes</h4>
            {searchResults.results.map((res, i) => renderBusCard(res, i))}
          </div>
        )}

        {!loading && searchResults.suggestions.length > 0 && (
          <div className="suggestions-list" style={{ marginTop: '32px' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Suggested Alternatives
            </h4>
            {searchResults.suggestions.map((res, i) => renderBusCard(res, i, true))}
          </div>
        )}
      </div>

      <style jsx>{`
        .availability-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          margin-top: 12px;
        }
        .availability-notice.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .availability-notice.danger {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .bus-card.unavailable {
          opacity: 0.85;
          border-left: 4px solid #ef4444;
        }
        .bus-badge.pattern {
          background: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default SearchBuses;
