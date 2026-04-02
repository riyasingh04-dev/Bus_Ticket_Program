import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bus, Wind, Moon, Clock, AlertCircle, CheckCircle,
  Users, ArrowRight, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

const LOCK_DURATION = 120; // seconds
const POLL_INTERVAL = 4000; // ms

const SeatSelection = () => {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = location.state?.schedule;

  const [seatMap, setSeatMap] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockTimer, setLockTimer] = useState(LOCK_DURATION);
  const [lockActive, setLockActive] = useState(false);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [tooltip, setTooltip] = useState(null);
  const [stoppages, setStoppages] = useState([]);

  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Route Stoppages fetch ────────────────────────────────────────────────
  const fetchStoppages = useCallback(async () => {
    if (!schedule?.route_id) return;
    try {
      const res = await axios.get(`http://localhost:8000/routes/${schedule.route_id}/stoppages`);
      setStoppages(res.data);
    } catch {
      // Fail silently if stoppages aren't available
    }
  }, [schedule?.route_id]);

  useEffect(() => {
    fetchStoppages();
  }, [fetchStoppages]);

  // ── Seat map polling ─────────────────────────────────────────────────────
  const fetchSeats = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/bookings/seats/${scheduleId}`,
        { headers }
      );
      setSeatMap(res.data);
      setError('');
    } catch {
      setError('Unable to load seat data. Retrying…');
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchSeats();
    pollRef.current = setInterval(fetchSeats, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchSeats]);

  // ── Online/offline detection ──────────────────────────────────────────────
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!lockActive || !lockExpiry) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(lockExpiry) - Date.now()) / 1000));
      setLockTimer(remaining);
      if (remaining === 0) {
        setLockActive(false);
        setSelectedSeats([]);
        setError('⏰ Seat lock expired. Please re-select seats.');
        clearInterval(timerRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [lockActive, lockExpiry]);

  // ── Select / deselect seat ────────────────────────────────────────────────
  const toggleSeat = (seatInfo) => {
    if (seatInfo.status === 'booked') return;
    if (seatInfo.status === 'locked' && !seatInfo.locked_by_me) {
      setError(`⚠️ Seat ${seatInfo.seat} is currently locked by another user.`);
      return;
    }
    setError('');
    setSelectedSeats(prev => {
      if (prev.includes(seatInfo.seat)) return prev.filter(s => s !== seatInfo.seat);
      if (prev.length >= 6) { setError('Maximum 6 seats allowed per booking.'); return prev; }
      return [...prev, seatInfo.seat];
    });
  };

  // ── Lock selected seats ───────────────────────────────────────────────────
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) { setError('Please select at least one seat.'); return; }
    setLocking(true);
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:8000/bookings/seats/lock',
        { schedule_id: parseInt(scheduleId), seats: selectedSeats },
        { headers }
      );
      setLockExpiry(res.data.expires_at);
      setLockTimer(res.data.expires_in_seconds);
      setLockActive(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to lock seats. Please try again.');
    }
    setLocking(false);
  };

  // ── Proceed to passenger details (with automatic locking) ──────────────────
  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat first.');
      return;
    }

    if (!lockActive) {
      setLocking(true);
      setError('');
      try {
        const res = await axios.post(
          'http://localhost:8000/bookings/seats/lock',
          { schedule_id: parseInt(scheduleId), seats: selectedSeats },
          { headers }
        );
        const localLockExpiry = Date.now() + (res.data.expires_in_seconds * 1000);
        setLockExpiry(localLockExpiry);
        setLockTimer(res.data.expires_in_seconds);
        setLockActive(true);
        
        // After successful lock, proceed
        navigate(`/user/passenger/${scheduleId}`, {
          state: { schedule, selectedSeats, lockExpiry: localLockExpiry },
        });
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to lock seats. They might have been taken just now.');
      } finally {
        setLocking(false);
      }
    } else {
      // Already locked, just proceed
      navigate(`/user/passenger/${scheduleId}`, {
        state: { schedule, selectedSeats, lockExpiry },
      });
    }
  };

  // ── Layout helpers ────────────────────────────────────────────────────────
  const isSleeper = schedule?.bus?.bus_type?.name?.toLowerCase().includes('sleeper');
  const colsPerRow = isSleeper ? 2 : 4;

  // Group seats into rows
  const rows = [];
  for (let i = 0; i < seatMap.length; i += colsPerRow) {
    rows.push(seatMap.slice(i, i + colsPerRow));
  }

  const availableCount = seatMap.filter(s => s.status === 'available').length;
  const bookedCount = seatMap.filter(s => s.status === 'booked').length;

  const seatClass = (s) => {
    if (s.status === 'booked') return 'seat seat-booked';
    if (s.status === 'locked' && !s.locked_by_me) return 'seat seat-locked';
    if (selectedSeats.includes(s.seat)) return 'seat seat-selected';
    return 'seat seat-available';
  };

  const fmtTimer = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="seat-page">
      {/* ── Header ── */}
      <div className="seat-page-header">
        <div className="seat-page-header-left">
          <h1 className="seat-page-title">Select Your Seats</h1>
          {schedule && (
            <p className="seat-page-subtitle">
              <Bus size={14} />
              {schedule.bus?.name} &nbsp;·&nbsp;
              {schedule.route?.source_city?.name}
              <ArrowRight size={13} style={{ display: 'inline', margin: '0 4px' }} />
              {schedule.route?.destination_city?.name}
              &nbsp;·&nbsp;
              {schedule.bus?.is_ac && <><Wind size={12} /> AC &nbsp;·&nbsp;</>}
              {schedule.bus?.bus_type?.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {online ? (
            <span className="online-badge"><Wifi size={13} /> Live</span>
          ) : (
            <span className="offline-badge"><WifiOff size={13} /> Offline</span>
          )}
          <button className="btn-secondary" onClick={fetchSeats} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="seat-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Lock timer ── */}
      {lockActive && (
        <div className={`seat-timer-bar ${lockTimer <= 60 ? 'timer-urgent' : ''}`}>
          <Clock size={15} />
          Seats locked — complete booking in&nbsp;
          <strong>{fmtTimer(lockTimer)}</strong>
          &nbsp;or they will be released
        </div>
      )}

      <div className="seat-page-body">
        {/* ── Seat Map ── */}
        <div className="seat-map-panel">
          {/* Legend */}
          <div className="seat-legend">
            {[
              { cls: 'seat-available', label: 'Available' },
              { cls: 'seat-selected',  label: 'Selected'  },
              { cls: 'seat-locked',    label: 'Locked'    },
              { cls: 'seat-booked',    label: 'Booked'    },
            ].map(l => (
              <div className="legend-item" key={l.label}>
                <div className={`legend-dot ${l.cls}`} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Availability counter */}
          <div className="seat-availability">
            <Users size={15} />
            <span>
              <strong style={{ color: availableCount <= 5 ? 'var(--danger)' : 'var(--success)' }}>
                {availableCount}
              </strong>&nbsp;seats available
              {availableCount <= 5 && availableCount > 0 && (
                <span className="badge-urgent">🔥 Filling fast!</span>
              )}
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--gray-light)', fontSize: '13px' }}>
              {bookedCount} booked
            </span>
          </div>

          {/* Bus front indicator */}
          <div className="bus-front">
            <Bus size={18} />
            <span>Front of Bus</span>
          </div>

          {/* Seat grid */}
          {loading ? (
            <div className="seat-loading">
              <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '28px', height: '28px' }} />
              <p>Loading seats…</p>
            </div>
          ) : (
            <div className="seat-grid-wrapper">
              {rows.map((row, ri) => (
                <div key={ri} className="seat-row">
                  {row.map((s, ci) => (
                    <React.Fragment key={s.seat}>
                      {/* Aisle gap after 2nd seat in 2x2 layout */}
                      {!isSleeper && ci === 2 && <div className="seat-aisle" />}
                      <div
                        className={seatClass(s)}
                        onClick={() => toggleSeat(s)}
                        onMouseEnter={(e) => setTooltip({ seat: s, x: e.clientX, y: e.clientY })}
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

          {/* Tooltip */}
          {tooltip && (
            <div
              className="seat-tooltip"
              style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
            >
              <div><strong>{tooltip.seat.seat}</strong></div>
              <div>₹{schedule?.price || '—'}</div>
              <div style={{ textTransform: 'capitalize', color: 
                tooltip.seat.status === 'available' ? 'var(--success)' :
                tooltip.seat.status === 'booked' ? 'var(--gray)' :
                tooltip.seat.status === 'locked' ? 'var(--warning)' : 'var(--primary)'
              }}>{tooltip.seat.locked_by_me ? 'Locked by you' : tooltip.seat.status}</div>
            </div>
          )}
        </div>

        {/* ── Booking Summary ── */}
        <div className="seat-summary-panel">
          <div className="seat-summary-card">
            <h3>Booking Summary</h3>

            <div className="summary-row">
              <span>Selected seats</span>
              <span>{selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'}</span>
            </div>
            <div className="summary-row">
              <span>Price per seat</span>
              <span>₹{schedule?.price || 0}</span>
            </div>
            <div className="summary-row">
              <span>Base total</span>
              <span>₹{(selectedSeats.length * (schedule?.price || 0)).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>₹{(selectedSeats.length * (schedule?.price || 0) * 0.05).toFixed(2)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Estimated Total</span>
              <span>₹{(selectedSeats.length * (schedule?.price || 0) * 1.05).toFixed(2)}</span>
            </div>

            <p className="summary-note">* Final total after coupon applied in next step</p>

            <button
              className="sc-search-btn"
              style={{ marginTop: '20px' }}
              onClick={handleProceed}
              disabled={locking || selectedSeats.length === 0}
            >
              {locking ? (
                <><div className="spinner" /> Locking…</>
              ) : lockActive ? (
                <><ArrowRight size={16} /> Continue to Passenger Details</>
              ) : (
                <><CheckCircle size={16} /> Confirm & Proceed</>
              )}
            </button>
          </div>

          {/* Seat type guide */}
          <div className="seat-guide-card">
            <h4>Seat Layout</h4>
            <p>{isSleeper ? '1 × 2 Sleeper' : '2 × 2 Seater'} layout</p>
            <p style={{ fontSize: '12px', color: 'var(--gray-light)', marginTop: '4px' }}>
              Max 6 seats per booking
            </p>
          </div>

          {/* Route Stoppages Timeline */}
          {stoppages.length > 0 && (
            <div className="seat-summary-card" style={{ marginTop: '16px', padding: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px' }}>
                <Clock size={16} className="text-secondary" /> Route Stops & Timing
              </h4>
              
              <div style={{ position: 'relative', paddingLeft: '8px' }}>
                {/* Vertical connective line */}
                <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '11px', width: '2px', backgroundColor: 'var(--border)' }}></div>
                
                {stoppages.map((stop, i) => (
                  <div key={stop.id} style={{ position: 'relative', paddingLeft: '24px', marginBottom: i === stoppages.length - 1 ? '0' : '16px' }}>
                    {/* Time dot */}
                    <div style={{ position: 'absolute', left: '-1px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)', border: '2px solid var(--card)' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: '14px' }}>{stop.stop?.name}</div>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text)' }}>
                        {stop.arrival_time}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                      {stop.halt_duration} min halt
                    </div>
                    
                    {stop.hotel && (
                      <div style={{ marginTop: '6px', backgroundColor: 'var(--background)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ fontSize: '12px', display: 'block', marginTop: '1px' }}>🍽️</span>
                        <div>
                          <strong style={{ color: 'var(--secondary)' }}>{stop.hotel.name}</strong>
                          {stop.hotel.description && <div style={{ color: 'var(--gray)', fontSize: '10px', marginTop: '2px' }}>{stop.hotel.description}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
