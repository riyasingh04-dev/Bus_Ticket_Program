import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import { Bus, Settings, AlertCircle, Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';

const ManageBuses = () => {
  const [buses, setBuses] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', type_id: null, seat_type_id: null, is_ac: false, total_seats: 40,
    source: '', destination: '', departure_time: '', arrival_time: '',
    running_type: 'DAILY', running_days: '', start_date: new Date().toISOString().split('T')[0],
    price: 499
  });

  const runningTypes = [
    { id: 'DAILY', name: 'Runs Daily' },
    { id: 'ALTERNATE_DAYS', name: 'Every Alternate Day' },
    { id: 'WEEKDAYS', name: 'Specific Weekdays' },
    { id: 'WEEKENDS', name: 'Sat-Sun Only' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch data individually to prevent one failure from blocking others
      try {
        const bRes = await axios.get('http://localhost:8000/buses/my', authHeader);
        setBuses(bRes.data);
      } catch (e) { console.error("Buses fetch failed", e); }

      try {
        const btRes = await axios.get('http://localhost:8000/masters/bus-types', authHeader);
        setBusTypes(btRes.data || []);
      } catch (e) { console.error("Bus Types fetch failed", e); }

      try {
        const stRes = await axios.get('http://localhost:8000/masters/seat-types', authHeader);
        setSeatTypes(stRes.data || []);
      } catch (e) { console.error("Seat Types fetch failed", e); }

      try {
        const cRes = await axios.get('http://localhost:8000/masters/cities', authHeader);
        setCities(cRes.data || []);
      } catch (e) { console.error("Cities fetch failed", e); }

    } catch (err) {
      console.error("Critical error in fetchData", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type_id) return alert("Please select a bus type");

    try {
      const token = localStorage.getItem('token');
      // Clean payload: ensure null instead of empty strings for IDs
      const payload = {
        ...formData,
        type_id: formData.type_id ? parseInt(formData.type_id) : null,
        seat_type_id: formData.seat_type_id ? parseInt(formData.seat_type_id) : null,
        total_seats: parseInt(formData.total_seats),
        price: parseFloat(formData.price)
      };

      await axios.post('http://localhost:8000/buses', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchData();
      // Reset form
      setFormData({ 
        name: '', type_id: null, seat_type_id: null, is_ac: false, total_seats: 40,
        source: '', destination: '', departure_time: '', arrival_time: '',
        running_type: 'DAILY', running_days: '', start_date: new Date().toISOString().split('T')[0],
        price: 499
      });
      alert("Bus service registered successfully!");
    } catch (err) {
      console.error("Bus creation error:", err.response?.data);
      const msg = err.response?.data?.detail || "Make sure all fields are valid.";
      alert(`Failed to create bus: ${msg}`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} className="text-secondary" /> Register New Bus Service
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bus Name / Register No.</label>
              <input 
                required type="text" placeholder="e.g. Skyline Express (MH-12-AB-1234)"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
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

            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
              <SearchableSelect 
                label="Departure City"
                options={cities}
                placeholder="Pick Source"
                value={cities.find(c => c.name === formData.source)?.id || ''}
                onChange={val => {
                  const cityName = cities.find(c => String(c.id) === String(val))?.name || '';
                  setFormData({...formData, source: cityName});
                }}
              />
              <SearchableSelect 
                label="Destination City"
                options={cities}
                placeholder="Pick Destination"
                value={cities.find(c => c.name === formData.destination)?.id || ''}
                onChange={val => {
                  const cityName = cities.find(c => String(c.id) === String(val))?.name || '';
                  setFormData({...formData, destination: cityName});
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Departure Time</label>
                <div style={{ position: 'relative' }}>
                  <input required type="text" placeholder="e.g. 09:00 AM" value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} style={{ paddingLeft: '32px' }} />
                  <Clock size={14} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--gray)' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Arrival Time (Approx)</label>
                <div style={{ position: 'relative' }}>
                  <input required type="text" placeholder="e.g. 01:00 PM" value={formData.arrival_time} onChange={e => setFormData({...formData, arrival_time: e.target.value})} style={{ paddingLeft: '32px' }} />
                  <Clock size={14} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--gray)' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
              <SearchableSelect 
                label="Running Pattern"
                options={runningTypes}
                placeholder="Select Pattern"
                value={formData.running_type}
                onChange={val => setFormData({...formData, running_type: val})}
              />
              <div className="form-group">
                <label>Cycle Start Date</label>
                <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
            </div>

            {formData.running_type === 'WEEKDAYS' && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Running Days (comma separated)</label>
                <input type="text" placeholder="e.g. Mon,Wed,Fri" value={formData.running_days} onChange={e => setFormData({...formData, running_days: e.target.value})} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Seats Capacity</label>
                <input required type="number" min="1" max="100" value={formData.total_seats} onChange={e => setFormData({...formData, total_seats: parseInt(e.target.value)})} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '28px' }}>
                <input type="checkbox" checked={formData.is_ac} onChange={e => setFormData({...formData, is_ac: e.target.checked})} id="ac_check" style={{ width: 'auto' }} />
                <label htmlFor="ac_check" style={{ margin: 0, cursor: 'pointer' }}>Air Conditioned</label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Seat Price (₹)</label>
              <input required type="number" min="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Add Bus Service
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bus size={20} className="text-primary" /> Active Fleet & Patterns
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bus & Route</th>
                  <th>Pattern</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading fleet...</td></tr>}
                {buses.map(bus => (
                  <tr key={bus.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{bus.name}</div>
                      <div className="text-gray" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} /> {bus.source} &rarr; {bus.destination}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-primary" style={{ fontSize: (bus.running_type || '').length > 10 ? '9px' : '10px' }}>{bus.running_type}</div>
                      {bus.running_days && <div style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '2px' }}>{bus.running_days}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{bus.departure_time}</div>
                    </td>
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
