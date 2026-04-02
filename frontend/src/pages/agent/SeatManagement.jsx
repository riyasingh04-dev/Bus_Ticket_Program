import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Bus, MapPin, Calendar, Clock, AlertCircle, 
  Users, RefreshCw, Info, CheckCircle, XCircle,
  ChevronRight, Filter
} from 'lucide-react';

const POLL_INTERVAL = 5000; // 5 seconds

const SeatManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [filters, setFilters] = useState({
    bus: '',
    route: '',
    date: ''
  });

  const pollRef = useRef(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch all schedules for this agent
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/routes/schedule/my', { headers });
      setSchedules(res.data);
      if (res.data.length > 0 && !selectedSchedule) {
        // Optionally auto-select the first one if needed, or leave for user
      }
    } catch (err) {
      setError('Failed to load schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fetch seats for selected schedule
  const fetchSeats = useCallback(async (schId) => {
    if (!schId) return;
    setSeatsLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/bookings/seats/${schId}`, { headers });
      setSeatMap(res.data);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError('Failed to update seat status.');
    } finally {
      setSeatsLoading(false);
    }
  }, [token]);

  // Handle schedule selection
  useEffect(() => {
    if (selectedSchedule) {
      fetchSeats(selectedSchedule.id);
      // Setup polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchSeats(selectedSchedule.id), POLL_INTERVAL);
    } else {
      setSeatMap([]);
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedSchedule, fetchSeats]);

  // Filter schedules
  const filteredSchedules = schedules.filter(sch => {
    const matchBus = !filters.bus || sch.bus?.name?.toLowerCase().includes(filters.bus.toLowerCase());
    const routeStr = `${sch.route?.source_city?.name} to ${sch.route?.destination_city?.name}`.toLowerCase();
    const matchRoute = !filters.route || routeStr.includes(filters.route.toLowerCase());
    const matchDate = !filters.date || sch.departure_time.startsWith(filters.date);
    return matchBus && matchRoute && matchDate;
  });

  // UI Helpers
  const isSleeper = selectedSchedule?.bus?.bus_type?.name?.toLowerCase().includes('sleeper');
  const colsPerRow = isSleeper ? 2 : 4;
  const rows = [];
  for (let i = 0; i < seatMap.length; i += colsPerRow) {
    rows.push(seatMap.slice(i, i + colsPerRow));
  }

  const availableCount = seatMap.filter(s => s.status === 'available').length;
  const bookedCount = seatMap.filter(s => s.status === 'booked').length;
  const lockedCount = seatMap.filter(s => s.status === 'locked').length;

  const seatClass = (s) => {
    if (s.status === 'booked') return 'seat-agent seat-booked';
    if (s.status === 'locked') return 'seat-agent seat-locked';
    return 'seat-agent seat-available';
  };

  if (loading) {
    return (
      <div className="seat-mgmt-loading">
        <div className="spinner" />
        <p>Initializing Seat Management…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bus className="text-primary" /> Seat Management Dashboard
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '4px' }}>
            Monitor real-time occupancy and booking status of your fleet.
          </p>
        </div>
        {selectedSchedule && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <RefreshCw size={12} className={seatsLoading ? 'spin' : ''} />
              Auto-refreshing: Last updated {lastRefreshed.toLocaleTimeString()}
            </div>
            <button className="btn-secondary" onClick={() => fetchSeats(selectedSchedule.id)} style={{ marginTop: '8px', padding: '6px 12px', fontSize: '13px' }}>
              Manual Refresh
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12" style={{ gap: '20px' }}>
        {/* Sidebar Filters & Schedule List */}
        <div className="col-span-4">
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} /> Filter Schedules
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Bus Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Scania" 
                  value={filters.bus} 
                  onChange={e => setFilters({...filters, bus: e.target.value})}
                  style={{ height: '36px' }}
                />
              </div>
              <div className="form-group">
                <label>Route</label>
                <input 
                  type="text" 
                  placeholder="e.g. Delhi to Mumbai" 
                  value={filters.route} 
                  onChange={e => setFilters({...filters, route: e.target.value})}
                  style={{ height: '36px' }}
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={filters.date} 
                  onChange={e => setFilters({...filters, date: e.target.value})}
                  style={{ height: '36px' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Active Schedules ({filteredSchedules.length})</h3>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredSchedules.map(sch => (
                <div 
                  key={sch.id}
                  className={`sch-item ${selectedSchedule?.id === sch.id ? 'active' : ''}`}
                  onClick={() => setSelectedSchedule(sch)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {sch.route?.source_city?.name} → {sch.route?.destination_city?.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                        <Bus size={10} style={{ display: 'inline', marginRight: '4px' }} />
                        {sch.bus?.name} • {new Date(sch.departure_time).toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-light" />
                  </div>
                </div>
              ))}
              {filteredSchedules.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray)' }}>
                  No schedules found for these filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Seat Map Area */}
        <div className="col-span-8">
          {!selectedSchedule ? (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Info size={40} className="text-gray-light" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Select a Schedule</h2>
              <p style={{ color: 'var(--gray)', maxWidth: '400px', margin: '12px auto 0' }}>
                Choose a schedule from the sidebar to view the live bus occupancy map and detailed seat status.
              </p>
            </div>
          ) : (
            <div className="animate-fade-up">
              {/* Summary Panel */}
              <div className="grid grid-cols-3" style={{ gap: '16px', marginBottom: '20px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Total Seats</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{seatMap.length}</div>
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Available</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{availableCount}</div>
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--gray)' }}>
                    <XCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Booked</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{bookedCount}</div>
                  </div>
                </div>
              </div>

              {/* Seat Map */}
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>
                    Live Seat Map: <span style={{ color: 'var(--primary)' }}>{selectedSchedule.bus?.name}</span>
                  </h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <div className="legend-dot seat-available" /> Available
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <div className="legend-dot seat-locked" /> Locked
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <div className="legend-dot seat-booked" /> Booked
                    </div>
                  </div>
                </div>

                <div className="bus-container-agent">
                  <div className="bus-front" style={{ marginBottom: '20px' }}>
                    <Bus size={20} />
                    <span>Front of Bus</span>
                  </div>

                  {seatsLoading && seatMap.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <div className="spinner" />
                    </div>
                  ) : (
                    <div className="seat-grid-wrapper">
                      {rows.map((row, ri) => (
                        <div key={ri} className="seat-row">
                          {row.map((s, ci) => (
                            <React.Fragment key={s.seat}>
                              {!isSleeper && ci === 2 && <div className="seat-aisle" />}
                              <div 
                                className={seatClass(s)}
                                onMouseEnter={(e) => setTooltip({ 
                                  seat: s.seat, 
                                  status: s.status, 
                                  x: e.clientX, 
                                  y: e.clientY 
                                })}
                                onMouseLeave={() => setTooltip(null)}
                              >
                                {s.seat}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div 
          style={{ 
            position: 'fixed', 
            left: tooltip.x + 12, 
            top: tooltip.y - 12, 
            background: 'var(--card)', 
            border: '1px solid var(--border)', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            pointerEvents: 'none'
          }}
        >
          <div><strong>Seat {tooltip.seat}</strong></div>
          <div style={{ 
            textTransform: 'capitalize', 
            color: tooltip.status === 'available' ? 'var(--success)' : (tooltip.status === 'booked' ? 'var(--gray)' : 'var(--warning)'),
            fontWeight: 600,
            marginTop: '2px'
          }}>
            Status: {tooltip.status}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .sch-item {
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid var(--border);
        }
        .sch-item:hover {
          background: var(--background);
        }
        .sch-item.active {
          background: rgba(79, 70, 229, 0.05);
          border-left: 4px solid var(--primary);
        }
        .seat-agent {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          cursor: default;
          border: 1px solid var(--border);
          transition: transform 0.2s;
        }
        .seat-agent:hover {
          transform: scale(1.05);
        }
        .seat-booked { background: #E5E7EB; color: #6B7280; border-color: #D1D5DB; }
        .seat-locked { background: #FEF3C7; color: #D97706; border-color: #FCD34D; }
        .seat-available { background: #ECFDF5; color: #059669; border-color: #A7F3D0; }
        
        .bus-container-agent {
          background: #F8FAFC;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border);
          max-width: fit-content;
          margin: 0 auto;
        }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default SeatManagement;
