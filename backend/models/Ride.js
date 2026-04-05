const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passengerId: { type: String, required: true },
  driverId: { type: String },
  driverName: { type: String },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  vehicle: { type: String, enum: ['bike', 'auto', 'car'], required: true },
  distance: { type: Number },
  fare: { type: Number },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'ongoing', 'completed', 'cancelled'],
    default: 'requested'
  },
  paymentMethod: { type: String, enum: ['cash', 'online'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  rating: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
