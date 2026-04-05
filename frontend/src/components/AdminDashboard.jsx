import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);

  useEffect(() => {
    // Fetch all users
    axios.get('http://localhost:5000/api/users').then(res => setUsers(res.data));
    // Fetch all rides history
    axios.get('http://localhost:5000/api/rides').then(res => setRides(res.data));
  }, []);

  return (
    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', background: 'var(--bg-main)', pointerEvents: 'auto', zIndex: 100, marginTop: '80px' }}>
      <h1 style={{ color: 'var(--primary)' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Users Panel */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ marginBottom: '1rem' }}>All Registered Users ({users.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map(u => (
              <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block' }}>{u.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</span>
                </div>
                <span className="vehicle-tag" style={{ background: u.role === 'admin' ? '#ef4444' : u.role === 'driver' ? '#10b981' : 'var(--primary)' }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rides Panel */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ marginBottom: '1rem' }}>Global Ride History ({rides.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rides.map(r => (
              <div key={r._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--primary)' }}>{r.status.toUpperCase()}</strong>
                  <span style={{ fontWeight: 'bold' }}>₹{r.fare}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <strong>{r.pickupLocation}</strong> → <strong>{r.dropoffLocation}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                  <span>Pass: {r.passengerId.slice(-6)}</span>
                  <span>Driver: {r.driverName || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
