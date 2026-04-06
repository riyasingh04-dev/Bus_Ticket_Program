import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard, Shield, Lock, AlertCircle, ArrowRight,
  CheckCircle, RefreshCw, ChevronLeft, User
} from 'lucide-react';

const PaymentSimulator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    schedule, scheduleId, selectedSeats = [],
    passenger = {}, pricing = {}, lockExpiry,
    stoppages = [], boardingStop = null, droppingStop = null
  } = location.state || {};

  const [phase, setPhase] = useState('review'); // 'review' | 'processing' | 'done' | 'failed'
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const hasSubmitted = useRef(false);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

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

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'number') {
      // Remove non-digits and limit to 16
      value = value.replace(/\D/g, '').substring(0, 16);
      // Add spaces every 4 digits
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    } else if (name === 'expiry') {
      value = value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardDetails({ ...cardDetails, [name]: value });
    setFormErrors({ ...formErrors, [name]: '' });
  };

  const validateCard = () => {
    const errs = {};
    const cleanNum = cardDetails.number.replace(/\s/g, '');
    if (cleanNum.length !== 16) errs.number = 'Enter a valid 16-digit card number.';
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) errs.expiry = 'Use MM/YY format.';
    if (cardDetails.cvv.length < 3) errs.cvv = 'Invalid CVV.';
    if (!cardDetails.name.trim()) errs.name = 'Cardholder name is required.';
    return errs;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (hasSubmitted.current) return;

    const errs = validateCard();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

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
      hasSubmitted.current = false;
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
          <div className="payment-fail-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
            <AlertCircle size={48} />
          </div>
          <h2>Payment Failed</h2>
          <p className="payment-error-msg" style={{ marginTop: '16px', color: 'var(--gray)' }}>{error || 'Your seats have been released. You can try again or go back to search.'}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'center' }}>
            <button className="user-logout-btn" onClick={() => navigate('/user/search')}>
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
    navigate('/user/confirmation', { 
      state: { 
        booking: booked, 
        schedule, 
        selectedSeats, 
        passenger,
        boardingStop,
        droppingStop
      }, 
      replace: true 
    });
    return null;
  }

  return (
    <div className="payment-page">
      <div className="passenger-topbar">
        <button className="user-logout-btn" onClick={() => navigate(-1)}>
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
        {/* Left Side: Card Form */}
        <div className="payment-card animate-fade-up">
          <h2 className="payment-title">Secure Payment</h2>
          
          <form onSubmit={handlePay} className="card-form">
            <div className="card-input-group">
              <label><User size={13} /> Cardholder Name</label>
              <input
                name="name"
                className={`card-input ${formErrors.name ? 'error' : ''}`}
                placeholder="Full Name as on Card"
                value={cardDetails.name}
                onChange={handleInputChange}
              />
              {formErrors.name && <span className="pf-error">{formErrors.name}</span>}
            </div>

            <div className="card-input-group">
              <label><CreditCard size={13} /> Card Number</label>
              <input
                name="number"
                className={`card-input ${formErrors.number ? 'error' : ''}`}
                placeholder="0000 0000 0000 0000"
                value={cardDetails.number}
                onChange={handleInputChange}
                maxLength={19}
              />
              {formErrors.number && <span className="pf-error">{formErrors.number}</span>}
            </div>

            <div className="card-input-row">
              <div className="card-input-group">
                <label>Expiry Date</label>
                <input
                  name="expiry"
                  className={`card-input ${formErrors.expiry ? 'error' : ''}`}
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={handleInputChange}
                  maxLength={5}
                />
                {formErrors.expiry && <span className="pf-error">{formErrors.expiry}</span>}
              </div>
              <div className="card-input-group">
                <label><Lock size={13} /> CVV</label>
                <input
                  name="cvv"
                  type="password"
                  className={`card-input ${formErrors.cvv ? 'error' : ''}`}
                  placeholder="•••"
                  value={cardDetails.cvv}
                  onChange={handleInputChange}
                  maxLength={4}
                />
                {formErrors.cvv && <span className="pf-error">{formErrors.cvv}</span>}
              </div>
            </div>

            <div className="payment-trust-row" style={{ marginTop: '12px' }}>
              <span><Shield size={14} /> 100% Secure</span>
              <span><Lock size={14} /> 256-bit SSL</span>
            </div>

            <button type="submit" className="sc-search-btn" style={{ marginTop: '8px' }}>
              <CreditCard size={18} /> Pay ₹{finalTotal.toFixed(2)}
            </button>
            <p className="payment-disclaimer">
              Your transaction is secured with industry-standard encryption. 
              Seats are reserved only after successful payment.
            </p>
          </form>
        </div>

        {/* Right Side: Summary Card */}
        <div className="payment-summary-panel">
          <div className="booking-summary-sticky" style={{ position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Fare Brief</h3>
            
            <div className="payment-route-box">
              <div className="payment-route-text">
                {schedule?.route?.source_city?.name}
                <ArrowRight size={14} />
                {schedule?.route?.destination_city?.name}
              </div>
              <div className="payment-seats-badges">
                {selectedSeats.map(s => <span key={s} className="seat-pill">{s}</span>)}
              </div>
            </div>

            <div className="summary-rows">
              <div className="summary-row"><span>Base Fare</span><span>₹{baseTotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Taxes</span><span>₹{taxAmount.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="summary-row" style={{ color: 'var(--success)' }}>
                  <span>Discount</span><span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-divider" style={{ margin: '16px 0' }} />
              <div className="summary-row summary-total" style={{ fontSize: '22px', color: 'var(--primary)' }}>
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>Passenger</div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{passenger.passenger_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>{passenger.passenger_phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulator;
