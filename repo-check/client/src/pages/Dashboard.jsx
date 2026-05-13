import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bookingService from "../services/bookingService";

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getMyBookings().then((data) => {
      setBookings(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const totals = useMemo(() => {
    return bookings.reduce(
      (summary, booking) => ({
        tickets: summary.tickets + Number(booking.quantity || 0),
        spent: summary.spent + Number(booking.amount || 0),
      }),
      { tickets: 0, spent: 0 }
    );
  }, [bookings]);

  if (loading) {
    return <main className="section page-shell">Loading dashboard...</main>;
  }

  return (
    <main className="section page-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back, {user?.name || "User"}</h1>
          <p className="muted">Track tickets, upcoming plans, and your booking history.</p>
        </div>
        <Link to="/events" className="primary-button">
          Find events
        </Link>
      </div>

      <section className="stats-row">
        <div className="stat-card">
          <span>Total bookings</span>
          <strong>{bookings.length}</strong>
        </div>
        <div className="stat-card">
          <span>Tickets reserved</span>
          <strong>{totals.tickets}</strong>
        </div>
        <div className="stat-card">
          <span>Money spent</span>
          <strong>KES {totals.spent.toLocaleString()}</strong>
        </div>
      </section>

      <section className="hub-grid dashboard-hub">
        <Link to="/feed" className="hub-card">
          <span className="pill">Community</span>
          <h3>Post or read updates</h3>
          <p>Keep up with team calls, event recaps, and member stories.</p>
        </Link>
        <Link to="/groups" className="hub-card">
          <span className="pill">Groups</span>
          <h3>Join a circle</h3>
          <p>Find your people in tech, creative arts, mentorship, or service.</p>
        </Link>
        <Link to="/volunteer" className="hub-card">
          <span className="pill">Volunteer</span>
          <h3>Serve at events</h3>
          <p>Choose roles like registration, media, setup, or hospitality.</p>
        </Link>
        <Link to="/opportunities" className="hub-card">
          <span className="pill">Opportunities</span>
          <h3>Grow your skills</h3>
          <p>Explore training, mentorship sessions, and community openings.</p>
        </Link>
        <Link to="/profile" className="hub-card">
          <span className="pill">Profile</span>
          <h3>Build your identity</h3>
          <p>Show your interests, bio, and community activity.</p>
        </Link>
        <Link to="/creators" className="hub-card">
          <span className="pill">Follow</span>
          <h3>Follow organizers</h3>
          <p>Keep up with the creators and teams behind events.</p>
        </Link>
        <Link to="/media" className="hub-card">
          <span className="pill">Media</span>
          <h3>Share memories</h3>
          <p>Post event photos and highlights for the community.</p>
        </Link>
        <Link to="/notifications" className="hub-card">
          <span className="pill">Alerts</span>
          <h3>Stay notified</h3>
          <p>Track ticket alerts, volunteer openings, and opportunities.</p>
        </Link>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Bookings</p>
            <h2>Your tickets</h2>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            No bookings yet. Browse events and reserve your first ticket.
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking._id}>
                <div>
                  <h3>{booking.eventTitle}</h3>
                  <p>
                    {booking.quantity} ticket{booking.quantity === 1 ? "" : "s"} at{" "}
                    {booking.location || "venue TBA"}
                  </p>
                  <span>
                    Booked {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="booking-side">
                  <strong>KES {Number(booking.amount || 0).toLocaleString()}</strong>
                  <span className="status-pill">{booking.status || "confirmed"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Dashboard;
