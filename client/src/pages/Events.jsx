import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { eventCategories } from "../data/events";
import eventService from "../services/eventService";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    eventService.getEvents().then(setEvents);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory = category === "All" || event.category === category;
      const searchText = `${event.title} ${event.location} ${event.description}`.toLowerCase();
      return matchesCategory && searchText.includes(query.toLowerCase());
    });
  }, [events, query, category]);

  return (
    <main className="section page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Find your next experience</p>
          <h1>Events</h1>
        </div>
      </div>

      <div className="toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events, venues, or topics"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {eventCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="event-grid">
        {filteredEvents.map((event) => (
          <Link to={`/events/${event.id}`} className="event-card" key={event.id}>
            <img src={event.image} alt={event.title} />
            <div className="event-card-body">
              <span className="pill">{event.category}</span>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <div className="card-meta">
                <span>{event.location}</span>
                <strong>KES {event.price.toLocaleString()}</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="empty-state">No events match that search yet.</div>
      )}
    </main>
  );
};

export default Events;
