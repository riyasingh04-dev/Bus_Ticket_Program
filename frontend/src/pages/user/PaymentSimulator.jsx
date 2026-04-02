import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard, Shield, Lock, AlertCircle, ArrowRight,
  CheckCircle, RefreshCw, ChevronLeft
} from 'lucide-react';

const PaymentSimulator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    schedule, scheduleId, selectedSeats = [],
    passenger = {}, pricing = {}, lockExpiry
  } = location.state || {};

  const [phase, setPhase] = useState('review'); // 'review' | 'processing' | 'done' | 'failed'
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');
  const hasSubmitted = useRef(false); // prevent double submit

  const { finalTotal = 0, baseTotal = 0, taxAmount = 0, discountAmount = 0 } = pricing;

  // ── Warn before accidental page refresh ──────────────────────────────────
  useEffect(() => {
    if (phase === 'processing') {
      const handler = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [phase]);

  // ── Lock countdown redirect ───────────────────────────────────────────────
  useEffect(() => {
    if (!lockExpiry || phase !== 'review') return;
    const id = setInterval(() => {
      if (new Date(lockExpiry) <= new Date()) {
        clearInterval(id);
        alert('⏰ Seat lock expired. Please start over.');
        navigate('/user/search');
      }
    }, 3000);
    return () => clearInterval(id);
  }, [lockExpiry, phase]);

  const handlePay = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setPhase('processing');

    // Simulate payment processing delay (2 seconds)
    await new Promise(r => setTimeout(r, 2000));

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://localhost:8000/bookings/',
        {
          schedule_id: scheduleId,
          seat_numbers: selectedSeats.join(','),
          ...passenger,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooked(res.data);
      setPhase('done');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Booking failed. Please try again.';
      setPhase('failed');
      setError(msg);
    }
  };

  const handleRetry = () => {
    hasSubmitted.current = false;
    setPhase('review');
  };

  // ── PROCESSING screen ─────────────────────────────────────────────────────
  if (phase === 'processing') {
    return (
      <div className="payment-overlay">
        <div className="payment-processing-card">
          <div className="payment-spinner-ring" />
          <h2>Processing Payment</h2>
          <p>Please do not close or refresh this page…</p>
          <p className="payment-amount">₹{finalTotal.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  // ── FAILED screen ─────────────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <div className="payment-overlay">
        <div className="payment-failed-card">
          <div className="payment-fail-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Payment Failed</h2>
          <p className="payment-error-msg">{error || 'Your seats have been released. You can try again or go back to search.'}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => navigate('/user/search')}>
              <ChevronLeft size={16} /> Back to Search
            </button>
            <button className="sc-search-btn" style={{ flex: 'none', padding: '12px 28px' }} onClick={handleRetry}>
              <RefreshCw size={16} /> Retry Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS → redirect ────────────────────────────────────────────────────
  if (phase === 'done' && booked) {
    navigate('/user/confirmation', { state: { booking: booked, schedule, selectedSeats, passenger }, replace: true });
    return null;
  }

  // ── REVIEW / PAY screen ───────────────────────────────────────────────────
  return (
    <div className="payment-page">
      {/* Step indicator */}
      <div className="passenger-topbar">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="step-indicator">
          <div className="step step-done">1 Seat</div>
          <div className="step-line" />
          <div className="step step-done">2 Details</div>
          <div className="step-line" />
          <div className="step step-active">3 Payment</div>
        </div>
        <div />
      </div>

      <div className="payment-body">
        <div className="payment-card">
          <h2 className="payment-title">Order Summary</h2>

          {/* Route */}
          <div className="payment-route-box">
            <div className="payment-route-text">
              {schedule?.route?.source}
              <ArrowRight size={16} />
              {schedule?.route?.destination}
            </div>
            <div className="payment-seats-badges">
              {selectedSeats.map(s => <span key={s} className="seat-pill">{s}</span>)}
            </div>
          </div>

          {/* Passenger */}
          <div className="payment-info-grid">
            <div><span>Passenger</span><strong>{passenger.passenger_name || '—'}</strong></div>
            <div><span>Mobile</span><strong>{passenger.passenger_phone || '—'}</strong></div>
            <div><span>Age</span><strong>{passenger.passenger_age || '—'}</strong></div>
            <div><span>Bus</span><strong>{schedule?.bus?.name || '—'}</strong></div>
            <div><span>Departure</span>
              <strong>
                {schedule?.departure_time
                  ? new Date(schedule.departure_time).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                  : '—'}
              </strong>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="payment-price-box">
            <div className="summary-row"><span>Base Fare</span><span>₹{baseTotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>GST (5%)</span><span>+₹{taxAmount.toFixed(2)}</span></div>
            {discountAmount > 0 && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Coupon ({passenger.coupon_code})</span>
                <span>−₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total Payable</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Security badges */}
          <div className="payment-trust-row">
            <span><Shield size={14} /> 100% Secure</span>
            <span><Lock size={14} /> Encrypted</span>
            <span><CreditCard size={14} /> All cards accepted</span>
          </div>

          {/* Pay button */}
          <button
            className="sc-search-btn"
            style={{ marginTop: '24px', fontSize: '18px', padding: '16px' }}
            onClick={handlePay}
          >
            <CreditCard size={20} />
            Pay ₹{finalTotal.toFixed(2)}
          </button>
          <p className="payment-disclaimer">
            By clicking "Pay", you agree to our terms. Seats are confirmed on successful payment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulator;
