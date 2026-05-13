const express = require("express");
const router = express.Router();

const {
  createBooking,
  getUserBookings,
} = require("../controllers/bookingController");

// Routes
router.post("/", createBooking);
router.get("/my", getUserBookings);

module.exports = router;
