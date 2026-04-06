import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Phone, Hash, Tag, ArrowRight, ChevronLeft,
  CheckCircle, Percent, AlertCircle, Clock
} from 'lucide-react';

const TAX_RATE = 0.05;

const PassengerDetails = () => {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { schedule, selectedSeats = [], lockExpiry } = location.state || {};

  const [form, setForm] = useState({
    passenger_name: '',
    passenger_phone: '',
    passenger_age: '',
    coupon_code: '',
    boarding_stop_id: '',
    dropping_stop_id: ''
  });
  const [stoppages, setStoppages] = useState([]);
  const [loadingStoppages, setLoadingStoppages] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [errors, setErrors] = useState({});
  const [lockTimer, setLockTimer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pricePerSeat = schedule?.price || 0;
  const numSeats = selectedSeats.length;
  const baseTotal = numSeats * pricePerSeat;
  const taxAmount = baseTotal * TAX_RATE;
  const discountAmount = baseTotal * discountPct;
  const finalTotal = baseTotal + taxAmount - discountAmount;

  // ── Fetch Stoppages ───────────────────────────────────────────────────────
  useEffect(() => {
    if (schedule?.route_id) {
      setLoadingStoppages(true);
      axios.get(`http://localhost:8000/routes/${schedule.route_id}/stoppages`)
        .then(res => setStoppages(res.data))
        .catch(err => console.error("Could not fetch stoppages", err))
        .finally(() => setLoadingStoppages(false));
    }
  }, [schedule]);

  // ── Lock countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lockExpiry) return;
    const tick = () => {
      const rem = Math.max(0, Math.floor((new Date(lockExpiry) - Date.now()) / 1000));
      setLockTimer(rem);
      if (rem === 0) {
        alert('⏰ Seat lock expired. Please select seats again.');
        navigate(`/user/book/${scheduleId}`, { state: { schedule } });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockExpiry]);

  const fmtTimer = (sec) => {
    if (sec === null) return '--:--';
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const applyCoupon = () => {
    setCouponError('');
    const code = form.coupon_code.trim().toUpperCase();
    const coupons = { FIRST10: 0.10, SAVE20: 0.20, BUS50: 0.05 };
    if (coupons[code] !== undefined) {
      setDiscountPct(coupons[code]);
      setCouponApplied(true);
    } else {
      setCouponError('Invalid coupon code.');
      setCouponApplied(false);
      setDiscountPct(0);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setDiscountPct(0);
    setCouponError('');
    setForm({ ...form, coupon_code: '' });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.passenger_name.trim()) errs.passenger_name = 'Name is required.';
    if (!form.passenger_phone.trim()) errs.passenger_phone = 'Phone is required.';
    else if (!/^\d{10}$/.test(form.passenger_phone)) errs.passenger_phone = 'Must be 10 digits.';
    if (!form.passenger_age) errs.passenger_age = 'Age is required.';
    else if (parseInt(form.passenger_age) < 1 || parseInt(form.passenger_age) > 100)
      errs.passenger_age = 'Enter a valid age (1–100).';
      
    if (stoppages.length > 0) {
      if (!form.boarding_stop_id) errs.boarding_stop_id = 'Please select a boarding point.';
      if (!form.dropping_stop_id) errs.dropping_stop_id = 'Please select a dropping point.';
    }
    return errs;
  };

  // ── Submit → Transition to Payment ──────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    // Instead of calling backend, we go to payment simulator
    navigate('/user/payment', {
      state: {
        scheduleId: parseInt(scheduleId),
        schedule,
        selectedSeats,
        lockExpiry,
        passenger: {
          passenger_name: form.passenger_name,
          passenger_phone: form.passenger_phone,
          passenger_age: parseInt(form.passenger_age),
          coupon_code: couponApplied ? form.coupon_code.trim().toUpperCase() : null,
          boarding_stop_id: form.boarding_stop_id ? parseInt(form.boarding_stop_id) : null,
          dropping_stop_id: form.dropping_stop_id ? parseInt(form.dropping_stop_id) : null,
        },
        pricing: {
          baseTotal,
          taxAmount,
          discountAmount,
          finalTotal
        },
        stoppages, // to help with confirmation page later
        boardingStop: stoppages.find(s => s.stop_id === parseInt(form.boarding_stop_id)),
        droppingStop: stoppages.find(s => s.stop_id === parseInt(form.dropping_stop_id))
      }
    });
  };

  return (
    <div className="passenger-page">
      {/* ── Top Bar ── */}
      <div className="passenger-topbar">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="step-indicator">
          <div className="step step-done">1 Seat</div>
          <div className="step-line" />
          <div className="step step-active">2 Details & Confirm</div>
          <div className="step-line" />
          <div className="step">3 Done</div>
        </div>
        {lockTimer !== null && (
          <div className={`mini-timer ${lockTimer <= 60 ? 'timer-urgent' : ''}`}>
            <Clock size={13} /> {fmtTimer(lockTimer)}
          </div>
        )}
      </div>

      <div className="passenger-body">
        {/* ── Form ── */}
        <div className="passenger-form-panel">
          <h2 className="passenger-form-title">Passenger Details</h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '28px' }}>
            Seats: <strong>{selectedSeats.join(', ')}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="pf-group">
              <label><User size={13} /> Full Name</label>
              <input
                name="passenger_name"
                placeholder="Enter passenger name"
                value={form.passenger_name}
                onChange={handleChange}
                className={errors.passenger_name ? 'pf-input pf-input-error' : 'pf-input'}
              />
              {errors.passenger_name && <span className="pf-error">{errors.passenger_name}</span>}
            </div>

            {/* Phone */}
            <div className="pf-group">
              <label><Phone size={13} /> Mobile Number</label>
              <input
                name="passenger_phone"
                placeholder="10-digit mobile number"
                value={form.passenger_phone}
                onChange={handleChange}
                maxLength={10}
                className={errors.passenger_phone ? 'pf-input pf-input-error' : 'pf-input'}
              />
              {errors.passenger_phone && <span className="pf-error">{errors.passenger_phone}</span>}
            </div>

            {/* Age */}
            <div className="pf-group">
              <label><Hash size={13} /> Age</label>
              <input
                name="passenger_age"
                type="number" min="1" max="100"
                placeholder="Passenger age"
                value={form.passenger_age}
                onChange={handleChange}
                className={errors.passenger_age ? 'pf-input pf-input-error' : 'pf-input'}
              />
              {errors.passenger_age && <span className="pf-error">{errors.passenger_age}</span>}
            </div>

            {/* Boarding and Dropping Points */}
            {stoppages.length > 0 ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Pick-up & Drop-off Points</h4>
                <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                  <div className="pf-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Boarding Point</label>
                    <select 
                      name="boarding_stop_id"
                      value={form.boarding_stop_id}
                      onChange={handleChange}
                      className={errors.boarding_stop_id ? 'pf-input pf-input-error' : 'pf-input'}
                    >
                      <option value="">Select Boarding...</option>
                      {stoppages.map(stop => (
                        <option key={stop.id} value={stop.stop_id}>{stop.stop?.name} ({stop.arrival_time})</option>
                      ))}
                    </select>
                    {errors.boarding_stop_id && <span className="pf-error">{errors.boarding_stop_id}</span>}
                  </div>
                  
                  <div className="pf-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Dropping Point</label>
                    <select 
                      name="dropping_stop_id"
                      value={form.dropping_stop_id}
                      onChange={handleChange}
                      className={errors.dropping_stop_id ? 'pf-input pf-input-error' : 'pf-input'}
                    >
                      <option value="">Select Dropping...</option>
                      {stoppages.map(stop => (
                        <option key={stop.id} value={stop.stop_id}>{stop.stop?.name} ({stop.arrival_time})</option>
                      ))}
                    </select>
                    {errors.dropping_stop_id && <span className="pf-error">{errors.dropping_stop_id}</span>}
                  </div>
                </div>
              </div>
            ) : loadingStoppages ? (
               <div style={{ padding: '16px', fontSize: '12px', color: 'var(--gray)' }}>Loading route options...</div>
            ) : null}

            {/* Coupon */}
            <div className="pf-group">
              <label><Tag size={13} /> Coupon Code (optional)</label>
              <div className="coupon-row">
                <input
                  name="coupon_code"
                  placeholder="Try FIRST10, SAVE20, BUS50"
                  value={form.coupon_code}
                  onChange={(e) => { setForm({ ...form, coupon_code: e.target.value }); setCouponError(''); setCouponApplied(false); setDiscountPct(0); }}
                  disabled={couponApplied}
                  className="pf-input"
                  style={{ flex: 1 }}
                />
                {couponApplied ? (
                  <button type="button" className="btn-danger" onClick={removeCoupon}>Remove</button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={applyCoupon}
                    disabled={!form.coupon_code.trim()}
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponApplied && (
                <span className="coupon-success">
                  <CheckCircle size={13} /> {(discountPct * 100).toFixed(0)}% discount applied!
                </span>
              )}
              {couponError && <span className="pf-error"><AlertCircle size={13} /> {couponError}</span>}
            </div>

            <button type="submit" className="sc-search-btn" style={{ marginTop: '8px' }} disabled={submitting}>
              {submitting ? (
                <><div className="spinner" /> Booking...</>
              ) : (
                <><CheckCircle size={16} /> Confirm & Book Now</>
              )}
            </button>
          </form>
        </div>

        {/* ── Sticky Summary ── */}
        <div className="passenger-summary-panel">
          <div className="booking-summary-sticky">
            <h3>Price Summary</h3>

            <div className="summary-route">
              {schedule?.route?.source_city?.name}
              <ArrowRight size={14} />
              {schedule?.route?.destination_city?.name}
            </div>

            <div className="summary-rows">
              <div className="summary-row">
                <span>{numSeats} seat{numSeats > 1 ? 's' : ''} × ₹{pricePerSeat}</span>
                <span>₹{baseTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (5%)</span>
                <span>+₹{taxAmount.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="summary-row" style={{ color: 'var(--success)' }}>
                  <span><Percent size={12} /> Coupon discount</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total Payable</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-seats-list">
              {selectedSeats.map(s => (
                <span key={s} className="seat-pill">{s}</span>
              ))}
            </div>

            <div className="summary-security-note">
              🔒 100% Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
