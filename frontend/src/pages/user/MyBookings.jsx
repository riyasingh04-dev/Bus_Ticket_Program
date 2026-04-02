import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Ticket, ArrowRight, MapPin, Clock, Bus, Search } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/bookings/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`http://localhost:8000/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchBookings();
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  return (
    <div className="bookings-page">
      {/* ── Header ── */}
      <div className="bookings-page-header">
        <h1>My Travel Bookings</h1>
        <p>Manage and track all your bus trips</p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
          <div
            className="spinner"
            style={{
              margin: '0 auto 16px',
              borderColor: 'rgba(79,70,229,0.2)',
              borderTopColor: 'var(--primary)',
              width: '32px',
              height: '32px',
            }}
          />
          <p>Loading your bookings…</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Ticket size={36} />
          </div>
          <h3>No bookings yet</h3>
          <p>You haven't booked any trips. Start exploring routes now!</p>
          <Link to="/user/search" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Search size={15} />
            Search Buses
          </Link>
        </div>
      )}

      {/* ── Booking Cards ── */}
      {!loading && bookings.map((b, i) => (
        <div
          key={b.id}
          className="booking-card animate-fade-up"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="booking-card-left">
            {/* ID Badge */}
            <div className="booking-id-badge">
              <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px', opacity: 0.7 }}>BOOKING</div>
              <div>#{b.id}</div>
            </div>

            {/* Route Info */}
            <div className="booking-route">
              <h4>
                <MapPin size={14} style={{ color: 'var(--primary)' }} />
                {b.schedule?.route?.source_city?.name}
                <ArrowRight size={14} style={{ color: 'var(--gray-light)' }} />
                {b.schedule?.route?.destination_city?.name}
              </h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Clock size={12} />
                {b.schedule?.departure_time
                  ? new Date(b.schedule.departure_time).toLocaleString('en-IN', {
                      weekday: 'short', day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Bus size={12} />
                Seats: {b.seat_numbers}
              </p>
              {b.passenger_name && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'var(--light)', borderRadius: '8px', fontSize: '13px', color: 'var(--gray)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--dark-2)', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Passenger Info</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span><strong>{b.passenger_name}</strong> ({b.passenger_age})</span>
                    <span>📞 {b.passenger_phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price + Status + CTA */}
          <div className="booking-card-right">
            <div className="booking-price">₹{b.total_price}</div>
            <div className="booking-seats">Total Paid</div>
            <div style={{ marginBottom: '12px' }}>
              <span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-danger'}`}>
                {b.status === 'Confirmed' ? '✓' : '✕'} {b.status}
              </span>
            </div>
            {b.status === 'Confirmed' && (
              <button className="btn-danger" onClick={() => cancelBooking(b.id)}>
                Cancel Trip
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyBookings;
