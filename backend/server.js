const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io for Real-time location & status updates
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PUT']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('request_ride', (data) => {
    // 10. Notification "Ride Booked" triggers to all drivers
    io.emit('new_ride_request', data);
  });

  socket.on('accept_ride', (data) => {
    // 10. Notification "Driver Assigned" to passenger
    io.emit('ride_accepted', data);
  });

  socket.on('update_status', (data) => {
    // Basic Simulation (8) - Ongoing, Completed, Tracking
    io.emit('ride_status_update', data);
  });

  socket.on('driver_location_update', (data) => {
    io.emit('driver_moved', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
const rideRouter = require('./routes/rides');
const userRouter = require('./routes/users');
app.use('/api/rides', rideRouter);
app.use('/api/users', userRouter);

// DB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tuktuk';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});
