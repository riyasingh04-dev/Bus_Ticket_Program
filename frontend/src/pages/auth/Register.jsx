import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { Bus, User, Mail, Lock, UserPlus, Shield, Clock, Zap } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      alert("🎉 Account created! Please sign in.");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* ── Left Gradient Panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Bus size={36} />
          </div>
          <h1>ExpressBus</h1>
          <p>Join millions of travellers who book safe and comfortable bus journeys with ExpressBus.</p>
        </div>

        <div className="auth-features">
          {[
            { icon: <Shield size={18} />, text: 'Safe & Secure Payments' },
            { icon: <Clock size={18} />, text: 'Real-time Bus Tracking' },
            { icon: <Zap size={18} />, text: 'Instant Booking Confirmation' },
          ].map(f => (
            <div key={f.text} className="auth-feature-item">
              {f.icon}
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">
            Sign up for free and start booking bus tickets in minutes.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><User size={16} /></span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={16} /></span>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <><div className="spinner" /> Creating account…</>
                : <><UserPlus size={18} /> Create Account</>
              }
            </button>
          </form>

          <div className="auth-link-row">
            Already have an account?{' '}
            <Link to="/">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;