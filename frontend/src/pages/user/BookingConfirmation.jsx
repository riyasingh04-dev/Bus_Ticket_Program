import React, { useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, Download, Bus, MapPin, Clock,
  User, Phone, Ticket, Home, Search, ArrowRight, Mail
} from 'lucide-react';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, schedule, selectedSeats = [], passenger = {}, boardingStop, droppingStop } = location.state || {};
  const ticketRef = useRef(null);

  if (!booking) {
    return (
      <div className="empty-state" style={{ marginTop: '80px' }}>
        <div className="empty-state-icon"><Ticket size={36} /></div>
        <h3>No booking found</h3>
        <p>Please complete a booking first.</p>
        <Link to="/user" className="btn-primary" style={{ textDecoration: 'none' }}>Go Home</Link>
      </div>
    );
  }

  const ticketId = `EXP-${String(booking.id).padStart(6, '0')}`;

  const handleDownload = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Ticket ${ticketId}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #0F172A; background: #fff; }
            h1 { font-size: 28px; color: #4F46E5; margin-bottom: 4px; }
            .subtitle { color: #64748B; font-size: 14px; margin-bottom: 32px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
            .field span { display: block; font-size: 11px; font-weight: 600; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase; }
            .field strong { font-size: 15px; color: #0F172A; }
            .total { background: #EEF2FF; padding: 16px; border-radius: 8px; margin-top: 20px; display:flex; justify-content:space-between; align-items:center; }
            .total span { font-size: 14px; color: #4F46E5; font-weight: 600; }
            .total strong { font-size: 22px; color: #4F46E5; }
            .sep { border: none; border-top: 2px dashed #E2E8F0; margin: 24px 0; }
            button { margin-top:20px; background:#4F46E5; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:15px; cursor:pointer; }
          </style>
        </head>
        <body>
          <h1>🚌 ExpressBus Ticket</h1>
          <p class="subtitle">Booking confirmed! Show this at the boarding point.</p>
          <hr class="sep">
          <div class="grid">
            <div class="field"><span>Ticket ID</span><strong>${ticketId}</strong></div>
            <div class="field"><span>Status</span><strong>✅ Confirmed</strong></div>
            <div class="field"><span>Route</span><strong>${schedule?.route?.source_city?.name || ''} → ${schedule?.route?.destination_city?.name || ''}</strong></div>
            <div class="field"><span>Bus</span><strong>${schedule?.bus?.name || ''}</strong></div>
            <div class="field"><span>Departure</span><strong>${schedule?.departure_time ? new Date(schedule.departure_time).toLocaleString('en-IN') : '—'}</strong></div>
            <div class="field"><span>Seats</span><strong>${selectedSeats.join(', ')}</strong></div>
            <div class="field"><span>Passenger</span><strong>${passenger.passenger_name || booking.passenger_name || '—'}</strong></div>
            <div class="field"><span>Phone</span><strong>${passenger.passenger_phone || booking.passenger_phone || '—'}</strong></div>
            ${boardingStop ? `<div class="field"><span>Boarding Point</span><strong style="font-size:13px">${boardingStop.stop?.name} (${boardingStop.arrival_time})</strong></div>` : ''}
            ${droppingStop ? `<div class="field"><span>Dropping Point</span><strong style="font-size:13px">${droppingStop.stop?.name} (${droppingStop.arrival_time})</strong></div>` : ''}
          </div>
          <div class="total"><span>Total Paid</span><strong>₹${booking.total_price}</strong></div>
          <button onclick="window.print()">🖨 Print Ticket</button>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="confirmation-page">
      {/* ── Success banner ── */}
      <div className="confirmation-banner">
        <div className="confirmation-check-anim">
          <CheckCircle size={52} strokeWidth={1.5} />
        </div>
        <h1>Booking Confirmed!</h1>
        <p>Your seats are reserved. Have a great journey! 🚌</p>
      </div>

      {/* ── Ticket card ── */}
      <div className="ticket-card-wrapper" ref={ticketRef}>
        <div className="ticket-card">
          {/* Left punch */}
          <div className="ticket-punch ticket-punch-left" />
          <div className="ticket-punch ticket-punch-right" />

          {/* Header */}
          <div className="ticket-header">
            <div className="ticket-header-left">
              <div className="ticket-logo"><Bus size={22} /></div>
              <div>
                <div className="ticket-brand">ExpressBus</div>
                <div className="ticket-id">{ticketId}</div>
              </div>
            </div>
            <div className="ticket-status-badge">✓ Confirmed</div>
          </div>

          {/* Route */}
          <div className="ticket-route">
            <div className="ticket-city">
              <MapPin size={14} />
              {schedule?.route?.source_city?.name || '—'}
            </div>
            <div className="ticket-route-arrow">
              <div className="ticket-arrow-line" />
              <Bus size={20} />
              <div className="ticket-arrow-line" />
            </div>
            <div className="ticket-city" style={{ textAlign: 'right' }}>
              <MapPin size={14} />
              {schedule?.route?.destination_city?.name || '—'}
            </div>
          </div>

          {/* Dashed divider */}
          <div className="ticket-dashed" />

          {/* Info grid */}
          <div className="ticket-info-grid">
            <div className="ticket-info-item">
              <span>Bus</span>
              <strong>{schedule?.bus?.name || '—'}</strong>
            </div>
            <div className="ticket-info-item">
              <span>Departure</span>
              <strong>
                {schedule?.departure_time
                  ? new Date(schedule.departure_time).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                  : '—'}
              </strong>
            </div>
            <div className="ticket-info-item">
              <span>Seats</span>
              <strong>{selectedSeats.join(', ')}</strong>
            </div>
            <div className="ticket-info-item">
              <span>Passenger</span>
              <strong>{passenger.passenger_name || booking.passenger_name || '—'}</strong>
            </div>
            <div className="ticket-info-item">
              <span>Phone</span>
              <strong>{passenger.passenger_phone || booking.passenger_phone || '—'}</strong>
            </div>
            <div className="ticket-info-item">
              <span>Total Paid</span>
              <strong style={{ color: 'var(--primary)', fontSize: '20px' }}>
                ₹{booking.total_price}
              </strong>
            </div>
          </div>
          
          {/* Add Boarding / Dropping if available */}
          {(boardingStop || droppingStop) && (
            <>
              <div className="ticket-dashed" />
              <div className="ticket-info-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                {boardingStop && (
                  <div className="ticket-info-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span>Boarding Point</span>
                      <strong>{boardingStop.stop?.name}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span>Time</span>
                      <strong>{boardingStop.arrival_time}</strong>
                    </div>
                  </div>
                )}
                {droppingStop && (
                  <div className="ticket-info-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span>Dropping Point</span>
                      <strong>{droppingStop.stop?.name}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span>Time</span>
                      <strong>{droppingStop.arrival_time}</strong>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Notification simulation ── */}
      <div className="confirmation-notification-row">
        <div className="notification-sim">
          <Mail size={16} />
          Booking confirmation sent to your registered email
        </div>
        <div className="notification-sim">
          <Phone size={16} />
          SMS confirmation sent to {passenger.passenger_phone || '—'}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="confirmation-actions">
        <button className="btn-secondary" onClick={handleDownload}>
          <Download size={16} />
          Download Ticket
        </button>
        <Link to="/user/bookings" className="btn-primary" style={{ textDecoration: 'none' }}>
          <Ticket size={16} />
          My Bookings
        </Link>
        <Link to="/user" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <Home size={16} />
          Home
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
