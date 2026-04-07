import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import { MapPin, Calendar, Clock, CreditCard, Trash2, Plus, ArrowRight } from 'lucide-react';

const ManageRoutes = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeRouteStoppages, setActiveRouteStoppages] = useState([]);
  
  const [formData, setFormData] = useState({ 
    source_id: '', 
    destination_id: '', 
    bus_id: '', 
    departure_time: '', 
    arrival_time: '', 
    price: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Watch for Source/Dest changes to auto-load stoppages
  useEffect(() => {
    const sId = parseInt(formData.source_id);
    const dId = parseInt(formData.destination_id);
    if (sId && dId && routes.length > 0) {
      const matchedRoute = routes.find(r => r.source_id === sId && r.destination_id === dId);
      if (matchedRoute) {
        fetchStoppages(matchedRoute.id);
      } else {
        setActiveRouteStoppages([]);
      }
    } else {
      setActiveRouteStoppages([]);
    }
  }, [formData.source_id, formData.destination_id, routes]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [schedRes, busRes, cityRes, routeRes] = await Promise.all([
        axios.get('http://localhost:8000/routes/schedule/my', { headers }),
        axios.get('http://localhost:8000/buses/my', { headers }),
        axios.get('http://localhost:8000/masters/cities'),
        axios.get('http://localhost:8000/masters/routes')
      ]);
      setSchedules(schedRes.data);
      setBuses(busRes.data);
      setCities(cityRes.data);
      setRoutes(routeRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoppages = async (routeId) => {
    try {
      const res = await axios.get(`http://localhost:8000/routes/${routeId}/stoppages`, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setActiveRouteStoppages(res.data);
    } catch (err) {
      setActiveRouteStoppages([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.source_id === formData.destination_id) {
      return alert("Source and Destination cannot be the same");
    }
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      // 1. Get or create the master route based on IDs
      const routeRes = await axios.post('http://localhost:8000/routes/route', {
        source_id: parseInt(formData.source_id), 
        destination_id: parseInt(formData.destination_id)
      }, { headers });
      
      const route_id = routeRes.data.id;
      
      // 2. Create Schedule
      await axios.post('http://localhost:8000/routes/schedule', {
        route_id: route_id,
        bus_id: parseInt(formData.bus_id),
        departure_time: new Date(formData.departure_time).toISOString(),
        arrival_time: new Date(formData.arrival_time).toISOString(),
        price: parseFloat(formData.price)
      }, { headers });
      
      setFormData({ source_id: '', destination_id: '', bus_id: '', departure_time: '', arrival_time: '', price: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create schedule");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this schedule?")) return;
    try {
      await axios.delete(`http://localhost:8000/routes/schedule/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete schedule");
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2">
        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} className="text-secondary" /> Create New Schedule
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              <SearchableSelect 
                label="Source City"
                placeholder="From..."
                options={cities}
                value={formData.source_id}
                onChange={val => setFormData({...formData, source_id: val})}
              />
              <SearchableSelect 
                label="Destination City"
                placeholder="To..."
                options={cities}
                value={formData.destination_id}
                onChange={val => setFormData({...formData, destination_id: val})}
              />
            </div>
            
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Select Bus Vehicle</label>
              <select required value={formData.bus_id} onChange={e => setFormData({...formData, bus_id: e.target.value})}>
                <option value="">-- Choose Bus --</option>
                {buses.map(b => (
                   <option key={b.id} value={b.id}>{b.name} ({b.bus_type?.name})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '12px', marginTop: '12px' }}>
              <div className="form-group">
                <label>Departure</label>
                <input required type="datetime-local" value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Arrival</label>
                <input required type="datetime-local" value={formData.arrival_time} onChange={e => setFormData({...formData, arrival_time: e.target.value})} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Ticket Price (₹)</label>
              <input required type="number" step="1" placeholder="e.g. 500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>

            {activeRouteStoppages.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} className="text-primary" /> Imported Route Sequence
                </h4>
                <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeRouteStoppages.map((stop, i) => (
                    <div key={stop.id} style={{ position: 'relative', paddingLeft: '16px' }}>
                      <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{stop.stop?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Arr: {stop.arrival_time} • {stop.halt_duration}m halt</div>
                      {stop.hotel && (
                        <div style={{ fontSize: '11px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12px' }}>🍽️</span> {stop.hotel.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '12px', fontStyle: 'italic' }}>
                  Note: Stoppages are managed by administrators.
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
               {loading ? 'Creating...' : <><Plus size={18} /> Add Schedule</>}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} className="text-primary" /> Active Schedules
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Route Map</th>
                  <th>Timings</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                        {sch.route?.source_city?.name} <ArrowRight size={14} className="text-gray-light" /> {sch.route?.destination_city?.name}
                      </div>
                      <div className="text-gray" style={{ fontSize: '12px' }}>{sch.bus?.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        {new Date(sch.departure_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--success-text)' }}>₹{sch.price}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(sch.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>No active schedules found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRoutes;
