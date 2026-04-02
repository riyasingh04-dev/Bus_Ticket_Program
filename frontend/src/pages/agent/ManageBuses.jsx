import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import { Bus, Settings, AlertCircle, Plus, Trash2 } from 'lucide-react';

const ManageBuses = () => {
  const [buses, setBuses] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', type_id: '', seat_type_id: '', is_ac: false, total_seats: 40 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      const [bRes, btRes, stRes] = await Promise.all([
        axios.get('http://localhost:8000/buses/my', authHeader),
        axios.get('http://localhost:8000/masters/bus-types'),
        axios.get('http://localhost:8000/masters/seat-types')
      ]);
      
      setBuses(bRes.data);
      setBusTypes(btRes.data);
      setSeatTypes(stRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type_id) return alert("Please select a bus type");

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/buses', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      setFormData({ name: '', type_id: '', seat_type_id: '', is_ac: false, total_seats: 40 });
    } catch (err) {
      alert("Failed to create bus. Make sure all fields are valid.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/buses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2">
        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} className="text-secondary" /> Add New Bus
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bus Name / Register No.</label>
              <input 
                required type="text" placeholder="e.g. MH-12-AB-1234"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2" style={{ marginTop: '12px' }}>
              <SearchableSelect 
                label="Bus Type"
                options={busTypes}
                placeholder="Select Type"
                value={formData.type_id}
                onChange={val => setFormData({...formData, type_id: val})}
              />
              <SearchableSelect 
                label="Primary Seat"
                options={seatTypes}
                placeholder="Select Seat Type"
                value={formData.seat_type_id}
                onChange={val => setFormData({...formData, seat_type_id: val})}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <input type="checkbox" checked={formData.is_ac} onChange={e => setFormData({...formData, is_ac: e.target.checked})} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Air Conditioned (AC)</label>
            </div>
            <div className="form-group">
              <label>Total Seats Capacity</label>
              <input required type="number" min="1" max="100" value={formData.total_seats} onChange={e => setFormData({...formData, total_seats: parseInt(e.target.value)})} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Add Bus to Fleet
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bus size={20} className="text-primary" /> My Fleet (Buses)
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Name</th>
                  <th>Specs</th>
                  <th>Seats</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading fleet...</td></tr>}
                {buses.map(bus => (
                  <tr key={bus.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{bus.name}</div>
                      {bus.is_ac && <span className="badge badge-success" style={{ fontSize: '10px', marginTop: '4px' }}>AC</span>}
                    </td>
                    <td>
                      <div className="text-gray" style={{ fontSize: '13px' }}>{bus.bus_type?.name}</div>
                      <div className="text-gray" style={{ fontSize: '11px', opacity: 0.7 }}>{bus.seat_type?.name}</div>
                    </td>
                    <td>{bus.total_seats}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(bus.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {!loading && buses.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>No buses in your fleet yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBuses;
