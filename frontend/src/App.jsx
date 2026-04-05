import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Auth from './components/Auth'
import PassengerDashboard from './components/PassengerDashboard'
import DriverDashboard from './components/DriverDashboard'
import AdminDashboard from './components/AdminDashboard'
import { Car, LogOut, Wifi } from 'lucide-react'
import './App.css'

export const socket = io('http://localhost:5000')

function App() {
  const [user, setUser] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Check local storage for persistent login
    const storedUser = localStorage.getItem('tukTukUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // 10. Notifications - Global Toast Simulation
    socket.on('new_ride_request', (data) => {
      if(user && user.role === 'driver') {
        console.log('Notification: New Ride Request!', data);
        // Could trigger a toast notification here
      }
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('new_ride_request')
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('tukTukUser')
    setUser(null)
  }

  return (
    <div className="app-container">
      {/* Navbar Shared UI */}
      <nav className="navbar" style={{ zIndex: 1000}}>
        <div className="logo-container">
          <Car size={28} className="logo-icon" />
          <span>TukTuk</span>
          {user && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
            {user.role.toUpperCase()}
          </span>}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="status-badge" style={{ color: connected ? 'var(--success)' : 'var(--danger)', borderColor: connected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
            <Wifi size={16} opacity={connected ? 1 : 0.5} />
            {connected ? 'Live' : 'Connecting'}
          </div>
          
          {user && (
            <button onClick={handleLogout} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              Logout <LogOut size={18} />
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Router Simulation */}
      {!user ? (
        <Auth onLogin={(userData) => {
          setUser(userData)
          localStorage.setItem('tukTukUser', JSON.stringify(userData))
        }} />
      ) : (
        <>
          {user.role === 'admin' && <AdminDashboard />}
          {user.role === 'passenger' && <PassengerDashboard user={user} />}
          {user.role === 'driver' && <DriverDashboard user={user} />}
        </>
      )}
    </div>
  )
}

export default App
