import axios from "axios";
import eventService from "./eventService";

const API_BASE_URL = "http://localhost:5000/api";
const BOOKINGS_KEY = "iyf_bookings";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const readBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
  } catch {
    return [];
  }
};

const writeBookings = (bookings) => {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

export const bookingService = {
  getMyBookings: async () => {
    try {
      const response = await axiosInstance.get("/bookings/my");
      return response.data;
    } catch (error) {
      return readBookings();
    }
  },

  createBooking: async (eventId, quantity) => {
    const event = await eventService.getEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const booking = {
      _id: `booking-${Date.now()}`,
      eventId,
      eventTitle: event.title,
      quantity: Number(quantity),
      amount: Number(event.price || 0) * Number(quantity),
      status: "confirmed",
      createdAt: new Date().toISOString(),
      eventDate: event.date,
      location: event.location,
    };

    try {
      const response = await axiosInstance.post("/bookings", {
        eventId,
        quantity,
      });
      return response.data;
    } catch (error) {
      const bookings = readBookings();
      writeBookings([booking, ...bookings]);
      return booking;
    }
  },
};

export default bookingService;
