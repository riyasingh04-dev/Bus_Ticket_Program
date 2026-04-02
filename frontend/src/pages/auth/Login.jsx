import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { Bus, Mail, Lock, LogIn, Shield, Clock, Zap } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      login(res.data.access_token);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.detail || "Invalid credentials. Please try again.");
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
          <p>Your trusted travel partner for comfortable and affordable bus journeys across India.</p>
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
          <h2 className="auth-form-title">Welcome back!</h2>
          <p className="auth-form-subtitle">
            Sign in to your account to book tickets and manage your trips.
          </p>

          <form onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <><div className="spinner" /> Signing in…</>
                : <><LogIn size={18} /> Sign In</>
              }
            </button>
          </form>

          <div className="auth-link-row">
            Don't have an account?{' '}
            <Link to="/register">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;