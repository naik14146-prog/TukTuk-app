import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../App';
import { 
  MapPin, Navigation, Car, Wifi, Search, CheckCircle, 
  Gift, Bike, CircleDot, History, Star, CreditCard, PhoneCall 
} from 'lucide-react';

export default function PassengerDashboard({ user }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vehicle, setVehicle] = useState('auto');
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, accepted, completed
  const [currentRide, setCurrentRide] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Rating & Payment
  const [rating, setRating] = useState(0);

  const mapCenter = [12.9716, 77.5946];
  const distance = (pickup.length > 0 && dropoff.length > 0) ? ((pickup.length + dropoff.length) * 0.35).toFixed(1) : 0;
  
  const rates = { bike: 6, auto: 10, car: 15 };
  // Calculate final discounted price for the selected vehicle (matching what's shown in the UI)
  const basePrice = Math.floor(Math.max(20, Math.floor(distance * (rates[vehicle] || 10))) * 0.5);

  useEffect(() => {
    socket.on('ride_accepted', (data) => {
      if (rideStatus === 'searching' && data.passengerId === user._id) {
        setRideStatus('accepted');
        // Update local state with mock driver name if possible, or wait for next fetch
        setCurrentRide(prev => ({ ...prev, ...data }));
      }
    });

    socket.on('ride_status_update', (data) => {
       if(currentRide && data.id === currentRide._id && data.status === 'completed') {
           setRideStatus('completed');
       }
    });

    return () => {
      socket.off('ride_accepted');
      socket.off('ride_status_update');
    };
  }, [rideStatus, currentRide, user._id]);

  const loadHistory = async () => {
    const { data } = await axios.get(`http://localhost:5000/api/rides?passengerId=${user._id}`);
    setHistory(data);
    setHistoryOpen(!historyOpen);
  };

  const requestRide = async () => {
    if (!pickup || !dropoff || distance === 0) return;
    setRideStatus('searching');
    
    try {
      // Simulate API request to backend
      const { data } = await axios.post('http://localhost:5000/api/rides/request', {
        passengerId: user._id,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        vehicle,
        distance: parseFloat(distance),
        fare: basePrice
      });

      setCurrentRide(data.ride);
      if(data.isSurge) alert("Surge Pricing Active! 1.5x Multiplier Applied during peak hours.");

      socket.emit('request_ride', {
        ...data.ride,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
       console.error(error);
       alert("Error booking ride: " + (error.response?.data?.message || error.message));
       setRideStatus('idle');
    }
  };

  const cancelRide = async () => {
    if(!currentRide) return;
    await axios.put(`http://localhost:5000/api/rides/${currentRide._id}/status`, { status: 'cancelled' });
    setRideStatus('idle');
    setCurrentRide(null);
  };

  const completePayment = async () => {
    await axios.put(`http://localhost:5000/api/rides/${currentRide._id}/complete`, { 
      paymentMethod: 'online', 
      paymentStatus: 'paid',
      rating: rating 
    });
    setRideStatus('idle');
    setCurrentRide(null);
    setPickup(''); setDropoff('');
  };

  return (
    <>
      <div className="premium-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="main-content" style={{ zIndex: 10 }}>
        <div className="glass-panel" style={{ pointerEvents: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
             <h2 style={{ fontSize: '1.2rem' }}>Ready to ride, {user.name.split(' ')[0]}?</h2>
             <button onClick={loadHistory} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'flex', gap: '0.4rem', color: '#fff' }}>
                <History size={16} /> History
             </button>
          </div>

          <div className="panel-body">

            {historyOpen && (
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Your Ride History</h3>
                {history.map(r => (
                  <div key={r._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{r.pickupLocation} &rarr; {r.dropoffLocation}</strong>
                      <span className="vehicle-tag">{r.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{r.fare} • {r.vehicle.toUpperCase()}</div>
                  </div>
                ))}
                {history.length===0 && <p style={{color: 'var(--text-muted)'}}>No rides found.</p>}
                <button className="primary-btn" onClick={() => setHistoryOpen(false)}>Close</button>
              </div>
            )}

            {!historyOpen && rideStatus === 'idle' && (
              <>
                <div className="offer-banner">
                  <div className="offer-icon"><Gift size={20} /></div>
                  <div className="offer-text">
                    <h4>First Ride Offer!</h4>
                    <p>Enjoy 50% off on your first TukTuk ride today.</p>
                  </div>
                </div>

                <div className="routing-inputs">
                  <div className="route-line"></div>
                  <div className="input-field">
                    <CircleDot size={20} className="input-icon" />
                    <input type="text" placeholder="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                  </div>
                  <div className="input-field">
                    <Navigation size={20} className="input-icon" style={{ color: '#ef4444' }} />
                    <input type="text" placeholder="Drop-off destination" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
                  </div>
                </div>

                {distance > 0 && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>Est. Distance: <strong>{distance} km</strong></div>}

                <div className="vehicle-list">
                  <div className={`vehicle-card ${vehicle === 'bike' ? 'selected' : ''}`} onClick={() => setVehicle('bike')}>
                    <div className="vehicle-info"><div className="vehicle-icon"><Bike size={24} /></div><div className="vehicle-details"><h3>Bike</h3><p>1 Seat</p></div></div>
                    {distance > 0 && (
                      <div className="vehicle-price">
                        <div className="price-original">₹{Math.max(20, Math.floor(distance * rates.bike))}</div>
                        <div className="price-discounted">₹{Math.floor(Math.max(20, Math.floor(distance * rates.bike)) * 0.5)}</div>
                      </div>
                    )}
                  </div>
                  <div className={`vehicle-card ${vehicle === 'auto' ? 'selected' : ''}`} onClick={() => setVehicle('auto')}>
                    <div className="vehicle-info"><div className="vehicle-icon"><Car size={24} /></div><div className="vehicle-details"><h3>Auto</h3><p>3 Seats</p></div></div>
                    {distance > 0 && (
                      <div className="vehicle-price">
                        <div className="price-original">₹{Math.max(20, Math.floor(distance * rates.auto))}</div>
                        <div className="price-discounted">₹{Math.floor(Math.max(20, Math.floor(distance * rates.auto)) * 0.5)}</div>
                      </div>
                    )}
                  </div>
                  <div className={`vehicle-card ${vehicle === 'car' ? 'selected' : ''}`} onClick={() => setVehicle('car')}>
                    <div className="vehicle-info"><div className="vehicle-icon"><Car size={24} /></div><div className="vehicle-details"><h3>Car</h3><p>4 Seats</p></div></div>
                    {distance > 0 && (
                      <div className="vehicle-price">
                        <div className="price-original">₹{Math.max(20, Math.floor(distance * rates.car))}</div>
                        <div className="price-discounted">₹{Math.floor(Math.max(20, Math.floor(distance * rates.car)) * 0.5)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <button className="primary-btn" onClick={requestRide} disabled={!pickup || !dropoff || distance == 0}>
                  Confirm Booking <Search size={18} />
                </button>
              </>
            )}

            {!historyOpen && rideStatus === 'searching' && (
              <div className="searching-state">
                <div className="pulse-ring"><Car size={32} color="var(--primary)" /></div>
                <h3>Locating drivers near you...</h3>
                <p style={{ color: 'var(--text-muted)' }}>Status: <strong>Booked (Pending Assignment)</strong></p>
                <button style={{ marginTop: '1rem', background: 'var(--danger)', color: 'white', padding: '0.8rem 2rem', borderRadius: '8px' }} onClick={cancelRide}>
                  Cancel Ride
                </button>
              </div>
            )}

            {!historyOpen && rideStatus === 'accepted' && (
              <div className="accepted-state">
                <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h2>Driver Assigned!</h2>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your Driver</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentRide?.driverName || "Ravi"}</p>
                    </div>
                    <a href="tel:+919876543210" style={{ textDecoration: 'none' }}>
                      <button style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PhoneCall size={20} />
                      </button>
                    </a>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></span>
                      <p><strong>Status:</strong> Ongoing</p>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Live Tracking: Driver is approx. 2 mins away 📍</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                  <button style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }} onClick={cancelRide}>
                    Cancel Ride
                  </button>

                  <button className="primary-btn" style={{ flex: 1, margin: 0, padding: '0.8rem' }} onClick={() => setRideStatus('completed')}>
                   Simulate Drop-off
                  </button>
                </div>
              </div>
            )}

            {!historyOpen && rideStatus === 'completed' && (
              <div className="accepted-state">
                <CreditCard size={48} color="var(--primary)" />
                <h2>Trip Completed</h2>
                <p style={{ color: 'var(--text-muted)' }}>You have arrived at your destination.</p>
                
                <div style={{ background: 'rgba(20,20,20,0.8)', padding: '1rem', borderRadius: '12px', width: '100%', margin: '1rem 0' }}>
                   <h3>Total Fare: ₹{currentRide?.fare || 0}</h3>
                   <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Cash / Online Payment accepted</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <p>Rate the driver:</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={28} fill={rating >= star ? "var(--primary)" : "none"} color={rating >= star ? "var(--primary)" : "var(--border)"} onClick={() => setRating(star)} style={{ cursor: 'pointer' }}/>
                    ))}
                  </div>
                </div>

                <button className="primary-btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={completePayment} disabled={rating === 0}>
                  Pay online & Submit Rating
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
