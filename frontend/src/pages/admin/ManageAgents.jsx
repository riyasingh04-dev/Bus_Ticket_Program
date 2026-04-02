import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageAgents = () => {
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await axios.get('http://localhost:8000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAgents(res.data.filter(u => u.role === 'agent'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/users/agent', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFormData({ name: '', email: '', password: '' });
      fetchAgents();
    } catch (err) {
      alert("Failed to create agent");
    }
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:8000/users/${id}/status`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-2">
      <div className="card">
        <h2 className="header-title">Create New Agent</h2>
        <form onSubmit={handleCreateAgent}>
          <div className="form-group">
            <label>Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Agent"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="header-title">Agent List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>
                    <span className={`badge ${agent.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(agent.id, agent.is_active)}
                      style={{padding: '6px 10px', background: agent.is_active ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                      {agent.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAgents;
