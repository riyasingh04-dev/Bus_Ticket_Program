import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import UserLayout from "../layouts/UserLayout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageAgents from "../pages/admin/ManageAgents";
import AdminMasters from "../pages/admin/AdminMasters";

// Agent
import AgentDashboard from "../pages/agent/AgentDashboard";
import ManageBuses from "../pages/agent/ManageBuses";
import ManageRoutes from "../pages/agent/ManageRoutes";
import SeatManagement from "../pages/agent/SeatManagement";

// User
import UserDashboard from "../pages/user/UserDashboard";
import SearchBuses from "../pages/user/SearchBuses";
import MyBookings from "../pages/user/MyBookings";
import SeatSelection from "../pages/user/SeatSelection";
import PassengerDetails from "../pages/user/PassengerDetails";
import PaymentSimulator from "../pages/user/PaymentSimulator";
import BookingConfirmation from "../pages/user/BookingConfirmation";

import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
      color: 'white', fontFamily: 'Inter,sans-serif', fontSize: '18px', gap: '12px'
    }}>
      <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Loading…
    </div>
  );
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'agent') return <Navigate to="/agent" replace />;
    return <Navigate to="/user" replace />;
  }
  return <Login />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/register" element={<Register />} />

        {/* ── Admin — sidebar layout ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/agents" element={<ManageAgents />} />
            <Route path="/admin/masters" element={<AdminMasters />} />
          </Route>
        </Route>

        {/* ── Agent — sidebar layout ── */}
        <Route element={<ProtectedRoute allowedRoles={['agent', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/buses" element={<ManageBuses />} />
            <Route path="/agent/routes" element={<ManageRoutes />} />
            <Route path="/agent/seats" element={<SeatManagement />} />
          </Route>
        </Route>

        {/* ── User — top navbar layout ── */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'agent', 'admin']} />}>
          <Route element={<UserLayout />}>
            <Route path="/user"                    element={<UserDashboard />} />
            <Route path="/user/search"             element={<SearchBuses />} />
            <Route path="/user/bookings"           element={<MyBookings />} />
            <Route path="/user/book/:scheduleId"   element={<SeatSelection />} />
            <Route path="/user/passenger/:scheduleId" element={<PassengerDetails />} />
            <Route path="/user/payment"            element={<PaymentSimulator />} />
            <Route path="/user/confirmation"       element={<BookingConfirmation />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;