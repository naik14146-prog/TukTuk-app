const router = require('express').Router();
const Ride = require('../models/Ride');

// 2. Book a Ride
router.post('/request', async (req, res) => {
  try {
    const { passengerId, pickupLocation, dropoffLocation, vehicle, distance, fare: clientFare } = req.body;
    
    // Vehicle-specific rates (Backend consistency)
    const rates = { bike: 6, auto: 10, car: 15 };
    const baseRate = rates[vehicle] || 10;
    
    // Calculate fare if not accurate or just use a calculated one for security
    // We'll trust client for now but add backend-side validation/adjustment
    const calculatedBaseFare = Math.floor(Math.max(20, distance * baseRate) * 0.5); 
    const finalFareToUse = clientFare || calculatedBaseFare;

    // Surge pricing basic simulation (10% chance of 1.5x price)
    const isSurge = Math.random() > 0.9;
    const finalFare = isSurge ? Math.round(finalFareToUse * 1.5) : finalFareToUse;

    let driverName = "Auto-assigned " + (['Ravi', 'Suresh', 'Amit', 'Vikram'][Math.floor(Math.random() * 4)]);

    const newRide = new Ride({
      passengerId,
      pickupLocation,
      dropoffLocation,
      vehicle,
      distance,
      fare: finalFare,
      status: 'requested',
      driverName: driverName // (4) Driver Assignment (Basic simulation)
    });

    const savedRide = await newRide.save();
    res.json({ ride: savedRide, isSurge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Driver Panel - Accept/Reject
router.put('/:id/status', async (req, res) => {
  try {
    const { status, driverId } = req.body; // status can be 'accepted', 'ongoing', 'completed', 'cancelled'
    
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    ride.status = status;
    if (driverId) ride.driverId = driverId;

    const updatedRide = await ride.save();
    res.json(updatedRide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 12. Rating & Payment Status
router.put('/:id/complete', async (req, res) => {
  try {
    const { paymentMethod, paymentStatus, rating } = req.body;
    
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if(paymentMethod) ride.paymentMethod = paymentMethod;
    if(paymentStatus) ride.paymentStatus = paymentStatus;
    if(rating) ride.rating = rating;
    ride.status = 'completed';

    const updatedRide = await ride.save();
    res.json(updatedRide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. View Ride History (by user OR all for admin)
router.get('/', async (req, res) => {
  try {
    const { passengerId, driverId } = req.query;
    let query = {};
    if (passengerId) query.passengerId = passengerId;
    if (driverId) query.driverId = driverId;

    // Sort by newest first
    const rides = await Ride.find(query).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get active requested rides
router.get('/active', async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'requested' }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
