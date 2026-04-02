import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, MapPin, AlertCircle, CheckCircle2, Coffee } from 'lucide-react';

const AdminHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [stops, setStops] = useState([]);
  const [formData, setFormData] = useState({ name: '', stop_id: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, stopsRes] = await Promise.all([
        axios.get('http://localhost:8000/masters/hotels', authHeader),
        axios.get('http://localhost:8000/masters/stops', authHeader)
      ]);
      setHotels(hotelsRes.data);
      setStops(stopsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.stop_id) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/masters/hotels', formData, authHeader);
      setSuccess('Hotel/Food Point added successfully!');
      setFormData({ name: '', stop_id: '', description: '' });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/masters/hotels/${id}`, authHeader);
      fetchData();
    } catch (err) {
      setError('Failed to delete hotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2">
      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px' }}>Add New Hotel / Food Point</h3>
        <form onSubmit={handleAddHotel} className="master-form">
          <div className="form-group">
            <label>Hotel/Restaurant Name</label>
            <input 
              type="text" 
              placeholder="e.g., Highway King / McD"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Linked Stop Location</label>
            <select 
              value={formData.stop_id} 
              onChange={e => setFormData({...formData, stop_id: e.target.value})}
              required
            >
              <option value="">Select Stop...</option>
              {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Good for family, pure veg"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Adding...' : <><Plus size={18} /> Add Hotel</>}
          </button>
        </form>

        {error && <div className="alert alert-danger" style={{ marginTop: '16px' }}><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: '16px' }}><CheckCircle2 size={16} /> {success}</div>}
      </div>

      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px' }}>Existing Hotels</h3>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Hotel Info</th>
                <th>Location</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && hotels.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>}
              {hotels.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Coffee size={14} className="text-secondary" /> {item.name}
                    </div>
                    {item.description && <div className="text-gray" style={{ fontSize: '12px' }}>{item.description}</div>}
                  </td>
                  <td>
                    <div className="badge badge-outline" style={{ fontSize: '12px' }}>
                      {item.stop?.name || 'Unknown'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {!loading && hotels.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>No hotels found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHotels;
