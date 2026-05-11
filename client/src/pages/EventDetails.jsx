import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bookingService from "../services/bookingService";
import eventService from "../services/eventService";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    eventService.getEventById(eventId).then(setEvent);
  }, [eventId]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/events/${eventId}` } });
      return;
    }

    await bookingService.createBooking(event.id, quantity);
    setMessage("Booking confirmed. Your dashboard has been updated.");
  };

  if (!event) {
    return (
      <main className="section page-shell">
        <div className="empty-state">Event not found.</div>
      </main>
    );
  }

  return (
    <main className="details-page">
      <section className="details-hero">
        <img src={event.image} alt={event.title} />
        <div className="details-copy">
          <Link to="/events" className="text-link">Back to events</Link>
          <span className="pill">{event.category}</span>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
          <div className="details-meta">
            <span>{new Date(event.date).toLocaleString()}</span>
            <span>{event.location}</span>
            <span>{event.organizer}</span>
          </div>
        </div>
      </section>

      <section className="section booking-layout">
        <div>
          <p className="eyebrow">About this event</p>
          <h2>Everything is ready for attendees.</h2>
          <p className="muted">
            Seats are tracked, ticket totals are calculated, and successful
            bookings appear instantly on the dashboard.
          </p>
        </div>
        <aside className="booking-box">
          <div className="price-line">
            <span>Ticket price</span>
            <strong>KES {event.price.toLocaleString()}</strong>
          </div>
          <label>
            Tickets
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(item) => setQuantity(Number(item.target.value))}
            />
          </label>
          <div className="price-line total">
            <span>Total</span>
            <strong>KES {(event.price * quantity).toLocaleString()}</strong>
          </div>
          <button className="primary-button full-button" onClick={handleBooking}>
            Book tickets
          </button>
          {message && <p className="success-message">{message}</p>}
        </aside>
      </section>
    </main>
  );
};

export default EventDetails;
