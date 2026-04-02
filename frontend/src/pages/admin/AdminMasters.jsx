import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, MapPin, Bus, Settings, Route, 
  Search, AlertCircle, CheckCircle2, X, Map, Coffee
} from 'lucide-react';
import AdminStops from './AdminStops';
import AdminHotels from './AdminHotels';
import RouteStoppages from './RouteStoppages';

const AdminMasters = () => {
  const [activeTab, setActiveTab] = useState('cities');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [cities, setCities] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [routes, setRoutes] = useState([]);

  // Form states
  const [newName, setNewName] = useState('');
  const [routeForm, setRouteForm] = useState({ source_id: '', destination_id: '' });

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'cities') {
        const res = await axios.get('http://localhost:8000/masters/cities');
        setCities(res.data);
      } else if (activeTab === 'busTypes') {
        const res = await axios.get('http://localhost:8000/masters/bus-types');
        setBusTypes(res.data);
      } else if (activeTab === 'seatTypes') {
        const res = await axios.get('http://localhost:8000/masters/seat-types');
        setSeatTypes(res.data);
      } else if (activeTab === 'routes') {
        const [rRes, cRes] = await Promise.all([
          axios.get('http://localhost:8000/masters/routes'),
          axios.get('http://localhost:8000/masters/cities')
        ]);
        setRoutes(rRes.data);
        setCities(cRes.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaster = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setLoading(true);
    try {
      const endpoint = activeTab === 'cities' ? 'cities' : 
                       activeTab === 'busTypes' ? 'bus-types' : 'seat-types';
      await axios.post(`http://localhost:8000/masters/${endpoint}`, { name: newName }, authHeader);
      setSuccess(`${activeTab.slice(0, -1)} added successfully!`);
      setNewName('');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.source_id || !routeForm.destination_id) return;
    if (routeForm.source_id === routeForm.destination_id) {
      setError('Source and Destination cannot be the same');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/masters/routes', routeForm, authHeader);
      setSuccess('Route added successfully!');
      setRouteForm({ source_id: '', destination_id: '' });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add route');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    
    setLoading(true);
    try {
      const endpoint = activeTab === 'cities' ? 'cities' : 
                       activeTab === 'busTypes' ? 'bus-types' : 
                       activeTab === 'seatTypes' ? 'seat-types' : 'routes';
      await axios.delete(`http://localhost:8000/masters/${endpoint}/${id}`, authHeader);
      fetchData();
    } catch (err) {
      setError('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings className="text-primary" /> Master Data Management
        </h2>
        <p className="text-gray" style={{ marginTop: '-12px', fontSize: '14px' }}>
          Configure cities, routes, and bus specifications for the entire platform.
        </p>

        {/* Tabs */}
        <div className="tabs-container" style={{ marginTop: '24px' }}>
          <button 
            className={`tab-btn ${activeTab === 'cities' ? 'active' : ''}`} 
            onClick={() => setActiveTab('cities')}
          >
            <MapPin size={16} /> Cities
          </button>
          <button 
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('routes')}
          >
            <Route size={16} /> Routes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stoppages' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stoppages')}
          >
            <Route size={16} /> Route Map
          </button>
          <button 
            className={`tab-btn ${activeTab === 'busTypes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('busTypes')}
          >
            <Bus size={16} /> Bus Types
          </button>
          <button 
            className={`tab-btn ${activeTab === 'seatTypes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('seatTypes')}
          >
            <Settings size={16} /> Seat Types
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stops' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stops')}
          >
            <MapPin size={16} /> Stops
          </button>
          <button 
            className={`tab-btn ${activeTab === 'hotels' ? 'active' : ''}`} 
            onClick={() => setActiveTab('hotels')}
          >
            <Coffee size={16} /> Hotels
          </button>
        </div>
      </div>

      {activeTab === 'stops' && <AdminStops />}
      {activeTab === 'hotels' && <AdminHotels />}
      {activeTab === 'stoppages' && <RouteStoppages />}

      {['cities', 'routes', 'busTypes', 'seatTypes'].includes(activeTab) && (
      <div className="grid grid-cols-2">
        {/* Form Layer */}
        <div className="card">
          <h3 className="header-title" style={{ fontSize: '18px' }}>
            Add New {activeTab === 'cities' ? 'City' : 
                     activeTab === 'busTypes' ? 'Bus Type' : 
                     activeTab === 'seatTypes' ? 'Seat Type' : 'Route'}
          </h3>
          
          {activeTab === 'routes' ? (
            <form onSubmit={handleAddRoute} className="master-form">
              <div className="form-group">
                <label>Source City</label>
                <select 
                  value={routeForm.source_id} 
                  onChange={e => setRouteForm({...routeForm, source_id: e.target.value})}
                  required
                >
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Destination City</label>
                <select 
                  value={routeForm.destination_id} 
                  onChange={e => setRouteForm({...routeForm, destination_id: e.target.value})}
                  required
                >
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Adding...' : <><Plus size={18} /> Add Route</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddMaster} className="master-form">
              <div className="form-group">
                <label>{activeTab === 'cities' ? 'City' : 'Type'} Name</label>
                <input 
                  type="text" 
                  placeholder={`Enter ${activeTab} name...`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Adding...' : <><Plus size={18} /> Add Entry</>}
              </button>
            </form>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginTop: '16px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginTop: '16px' }}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}
        </div>

        {/* List Layer */}
        <div className="card">
          <h3 className="header-title" style={{ fontSize: '18px' }}>Existing Entries</h3>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {activeTab === 'routes' ? (
                    <>
                      <th>Source</th>
                      <th>Destination</th>
                    </>
                  ) : (
                    <th>Name</th>
                  )}
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>}
                
                {activeTab === 'cities' && cities.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'routes' && routes.map(item => (
                  <tr key={item.id}>
                    <td>{item.source_city?.name}</td>
                    <td>{item.destination_city?.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'busTypes' && busTypes.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'seatTypes' && seatTypes.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {!loading && (
                  (activeTab === 'cities' && cities.length === 0) ||
                  (activeTab === 'routes' && routes.length === 0) ||
                  (activeTab === 'busTypes' && busTypes.length === 0) ||
                  (activeTab === 'seatTypes' && seatTypes.length === 0)
                ) && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>No entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default AdminMasters;
