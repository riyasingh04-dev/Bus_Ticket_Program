import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminStops = () => {
  const [stops, setStops] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/masters/stops', authHeader);
      setStops(res.data);
    } catch (err) {
      setError('Failed to fetch stops');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/masters/stops', { name: newName }, authHeader);
      setSuccess('Stop added successfully!');
      setNewName('');
      fetchStops();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add stop');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stop?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/masters/stops/${id}`, authHeader);
      fetchStops();
    } catch (err) {
      setError('Failed to delete stop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2">
      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px' }}>Add New Stop</h3>
        <form onSubmit={handleAddStop} className="master-form">
          <div className="form-group">
            <label>Stop Location Name</label>
            <input 
              type="text" 
              placeholder="e.g., Dharuhera / Behror"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Adding...' : <><Plus size={18} /> Add Stop</>}
          </button>
        </form>

        {error && <div className="alert alert-danger" style={{ marginTop: '16px' }}><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: '16px' }}><CheckCircle2 size={16} /> {success}</div>}
      </div>

      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px' }}>Existing Stops</h3>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Stop Name</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && stops.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>}
              {stops.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} className="text-secondary" /> {item.name}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {!loading && stops.length === 0 && (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>No stops found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStops;
