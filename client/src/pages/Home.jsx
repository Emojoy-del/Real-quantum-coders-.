import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import eventService from "../services/eventService";

const Home = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    eventService.getEvents().then((items) => setEvents(items.slice(0, 3)));
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay">
          <p className="eyebrow">IYF Event Ticketing</p>
          <h1>Discover, book, and manage events in one place.</h1>
          <p>
            Browse upcoming programs, reserve tickets, and keep every booking
            organized from your personal dashboard.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/events")}>
              Browse events
            </button>
            <button className="ghost-button" onClick={() => navigate("/create-event")}>
              Create event
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Upcoming</p>
            <h2>Featured Events</h2>
          </div>
          <Link to="/events" className="text-link">
            View all
          </Link>
        </div>
        <div className="event-grid">
          {events.map((event) => (
            <Link to={`/events/${event.id}`} className="event-card" key={event.id}>
              <img src={event.image} alt={event.title} />
              <div className="event-card-body">
                <span className="pill">{event.category}</span>
                <h3>{event.title}</h3>
                <p>{event.location}</p>
                <div className="card-meta">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <strong>KES {event.price.toLocaleString()}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section hub-band">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community Hub</p>
            <h2>More than tickets</h2>
          </div>
        </div>
        <div className="hub-grid">
          <Link to="/feed" className="hub-card">
            <span className="pill">Updates</span>
            <h3>Community Feed</h3>
            <p>Announcements, recaps, and member stories from the community.</p>
          </Link>
          <Link to="/groups" className="hub-card">
            <span className="pill">Belong</span>
            <h3>Groups</h3>
            <p>Join circles for tech, mentorship, creative arts, and volunteering.</p>
          </Link>
          <Link to="/volunteer" className="hub-card">
            <span className="pill">Serve</span>
            <h3>Volunteer Signups</h3>
            <p>Pick roles for upcoming events and help programs run smoothly.</p>
          </Link>
          <Link to="/opportunities" className="hub-card">
            <span className="pill">Grow</span>
            <h3>Opportunities</h3>
            <p>Find training, mentorship, and openings inside the community.</p>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
