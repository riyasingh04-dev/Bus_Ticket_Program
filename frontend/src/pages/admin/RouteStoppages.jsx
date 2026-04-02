import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Route as RouteIcon, MapPin, Coffee, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const RouteStoppages = () => {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [hotels, setHotels] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [stoppages, setStoppages] = useState([]); // from DB
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New Stoppage Form
  const [newStoppage, setNewStoppage] = useState({
    stop_id: '',
    arrival_time: '',
    halt_duration: 10,
    hotel_id: ''
  });

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedRouteId) {
      fetchStoppages(selectedRouteId);
    } else {
      setStoppages([]);
    }
  }, [selectedRouteId]);

  const fetchMasterData = async () => {
    try {
      const [rRes, sRes, hRes] = await Promise.all([
        axios.get('http://localhost:8000/masters/routes', authHeader),
        axios.get('http://localhost:8000/masters/stops', authHeader),
        axios.get('http://localhost:8000/masters/hotels', authHeader)
      ]);
      setRoutes(rRes.data);
      setStops(sRes.data);
      setHotels(hRes.data);
    } catch (err) {
      setError('Failed to fetch master data');
    }
  };

  const fetchStoppages = async (rId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/routes/${rId}/stoppages`, authHeader);
      setStoppages(res.data);
    } catch (err) {
      setError('Failed to fetch stoppages for route');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStoppage = async (e) => {
    e.preventDefault();
    if (!selectedRouteId) return setError('Please select a route first');
    if (!newStoppage.stop_id || !newStoppage.arrival_time) return;

    setLoading(true);
    try {
      const payload = {
        ...newStoppage,
        stop_order: stoppages.length + 1, // Auto-sequence at the end
        hotel_id: newStoppage.hotel_id ? parseInt(newStoppage.hotel_id) : null
      };

      await axios.post(`http://localhost:8000/routes/${selectedRouteId}/stoppages`, payload, authHeader);
      setSuccess('Stoppage added successfully!');
      
      // Reset form but keep time/duration logical
      setNewStoppage({ stop_id: '', arrival_time: '', halt_duration: 10, hotel_id: '' });
      fetchStoppages(selectedRouteId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add stoppage');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStoppage = async (id) => {
    if (!window.confirm('Delete this stoppage?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/routes/stoppages/${id}`, authHeader);
      fetchStoppages(selectedRouteId);
    } catch (err) {
      setError('Failed to delete stoppage');
    } finally {
      setLoading(false);
    }
  };

  // Filter hotels based on selected stop
  const availableHotels = hotels.filter(h => h.stop_id === parseInt(newStoppage.stop_id));

  return (
    <div className="grid grid-cols-2" style={{ gap: '24px' }}>
      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px' }}>Manage Route Map</h3>
        
        <div className="form-group">
          <label>Select Transport Route</label>
          <select 
            value={selectedRouteId} 
            onChange={e => setSelectedRouteId(e.target.value)}
            className="w-full"
          >
            <option value="">-- Choose Route to Manage --</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.source_city?.name} → {r.destination_city?.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRouteId && (
          <form onSubmit={handleAddStoppage} className="master-form" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Add Stop to Sequence</h4>
            
            <div className="form-group">
              <label>Stop Location</label>
              <select required value={newStoppage.stop_id} onChange={e => setNewStoppage({...newStoppage, stop_id: e.target.value, hotel_id: ''})}>
                <option value="">Select Stop...</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              <div className="form-group">
                <label>Arrival Time</label>
                <input required type="time" value={newStoppage.arrival_time} onChange={e => setNewStoppage({...newStoppage, arrival_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Halt (Minutes)</label>
                <input required type="number" min="0" value={newStoppage.halt_duration} onChange={e => setNewStoppage({...newStoppage, halt_duration: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Food Point / Hotel (Optional)</label>
              <select value={newStoppage.hotel_id} onChange={e => setNewStoppage({...newStoppage, hotel_id: e.target.value})} disabled={!newStoppage.stop_id}>
                <option value="">No food stop</option>
                {availableHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              {newStoppage.stop_id && availableHotels.length === 0 && (
                <small className="text-gray" style={{ display: 'block', marginTop: '4px' }}>No hotels mapped to this stop location.</small>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
              {loading ? 'Adding...' : <><Plus size={18} /> Append to Route</>}
            </button>
          </form>
        )}

        {error && <div className="alert alert-danger" style={{ marginTop: '16px' }}><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: '16px' }}><CheckCircle2 size={16} /> {success}</div>}
      </div>

      <div className="card">
        <h3 className="header-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RouteIcon size={18} /> Route Timeline Map
        </h3>

        {!selectedRouteId ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
            Select a route to view its mapped sequence.
          </div>
        ) : (
          <div className="timeline-container" style={{ marginTop: '16px' }}>
            {loading && stoppages.length === 0 && <div style={{ textAlign: 'center' }}>Loading timeline...</div>}
            
            {stoppages.map((stop, index) => (
              <div key={stop.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px', position: 'relative' }}>
                {/* Timeline Line */}
                {index !== stoppages.length - 1 && (
                  <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '-16px', width: '2px', backgroundColor: 'var(--border)' }}></div>
                )}
                
                {/* Timeline Dot */}
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontSize: '12px' }}>
                  {stop.stop_order}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, backgroundColor: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{stop.stop?.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--gray)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {stop.arrival_time}</span>
                        <span>•</span>
                        <span>{stop.halt_duration} min halt</span>
                      </div>
                    </div>
                    <button className="text-danger" onClick={() => handleDeleteStoppage(stop.id)} title="Remove Stoppage"><Trash2 size={16} /></button>
                  </div>
                  
                  {stop.hotel && (
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--card)', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
                      <Coffee size={14} className="text-secondary" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Meal Stop: {stop.hotel.name}</div>
                        {stop.hotel.description && <div className="text-gray" style={{ fontSize: '11px' }}>{stop.hotel.description}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && stoppages.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                No stops mapped for this route yet. Add the first one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteStoppages;
