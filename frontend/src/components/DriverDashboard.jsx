import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../App';
import { Wifi, CircleDot, Navigation, PhoneCall, User } from 'lucide-react';

export default function DriverDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    // 5. Driver Assignment - listening for general broadcast
    socket.on('new_ride_request', (data) => {
      setRequests(prev => [...prev, data]);
    });

    return () => {
      socket.off('new_ride_request');
    };
  }, []);

  useEffect(() => {
    // Fetch currently requested rides on mount
    axios.get('http://localhost:5000/api/rides/active').then(res => {
      setRequests(res.data);
    });
  }, []);

  const acceptRide = async (ride) => {
    // 9. Driver Panel - Accept ride
    const { data } = await axios.put(`http://localhost:5000/api/rides/${ride._id}/status`, {
      status: 'accepted',
      driverId: user._id
    });
    
    // Notify passenger
    socket.emit('accept_ride', {
      passengerId: ride.passengerId,
      driverId: user._id,
      driverName: user.name
    });

    setActiveRide(data);
    setRequests(prev => prev.filter(r => r._id !== ride._id));
  };

  const rejectRide = (rideId) => {
     setRequests(prev => prev.filter(r => r._id !== rideId));
  };

  const completeRide = async () => {
    // 5. Ride Status -> completed
    const { data } = await axios.put(`http://localhost:5000/api/rides/${activeRide._id}/status`, {
      status: 'completed'
    });
    
    // Notify passenger to show payment screen
    socket.emit('update_status', { id: activeRide._id, status: 'completed' });
    setActiveRide(null);
  };

  return (
    <>
      <div className="premium-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      <div className="main-content" style={{ pointerEvents: 'auto', zIndex: 100, flexDirection: 'column' }}>
      
      {!activeRide ? (
        <div className="ride-requests" style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>Welcome, {user.name} 👨‍✈️</h2>
          
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
              <Wifi size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
              <h3>Waiting for nearby passengers...</h3>
              <p>Stay online on this screen to receive requests.</p>
            </div>
          ) : (
            requests.map((req, idx) => (
              <div className="request-card" key={idx}>
                <div className="request-meta">
                  <span className="vehicle-tag">Requested {req.vehicle}</span>
                  <span style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--success)' }}>
                    ₹{req.fare} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Est.</span>
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CircleDot size={18} color="var(--primary)" />
                    <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pickup</div>
                      <div style={{ fontWeight: '500' }}>{req.pickupLocation}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Navigation size={18} color="#ef4444" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drop-off ({req.distance} km)</div>
                      <div style={{ fontWeight: '500' }}>{req.dropoffLocation}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', fontWeight: 'bold' }} onClick={() => rejectRide(req._id)}>
                    Reject
                  </button>
                  <button className="accept-btn" style={{ flex: 2 }} onClick={() => acceptRide(req)}>
                    Accept Ride
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', marginTop: '40px' }}>
           <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Active Ride: Ongoing</h2>
           
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ background: 'var(--bg-main)', padding: '0.8rem', borderRadius: '50%' }}>
                 <User size={24} color="var(--text-muted)" />
               </div>
               <div>
                 <p style={{ fontWeight: 'bold' }}>Passenger</p>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {activeRide.passengerId.slice(-6).toUpperCase()}</p>
               </div>
             </div>
             <a href="tel:+919876543210" style={{ textDecoration: 'none' }}>
               <button style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.8rem 1.2rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                 <PhoneCall size={18} /> Call
               </button>
             </a>
           </div>

           <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
             <p>Navigating to passenger at:</p>
             <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: '500' }}>Pickup: {activeRide.pickupLocation}</p>
             <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>Destination: <strong>{activeRide.dropoffLocation}</strong></p>
           </div>
           
           <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <span>Collect Cash:</span>
             <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>₹{activeRide.fare}</strong>
           </div>

           <button className="accept-btn" onClick={completeRide}>
             Mark as Driver Arrived & Drop Off Passenger
           </button>
        </div>
      )}
    </div>
    </>
  );
}
