const Booking = require("../models/Booking");
const Event = require("../models/Event");

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const totalPrice = event.price * quantity;

    const booking = await Booking.create({
      userId: req.user.id,
      eventId,
      quantity,
      totalPrice,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate("eventId");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

