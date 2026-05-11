import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import communityService from "../services/communityService";
import eventService from "../services/eventService";

const Volunteer = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [roles, setRoles] = useState([]);
  const [signups, setSignups] = useState([]);
  const [form, setForm] = useState({ eventId: "", role: "", note: "" });

  const loadSignups = () => communityService.getVolunteerSignups().then(setSignups);

  useEffect(() => {
    eventService.getEvents().then((items) => {
      setEvents(items);
      setForm((current) => ({ ...current, eventId: items[0]?.id || "" }));
    });
    communityService.getVolunteerRoles().then((items) => {
      setRoles(items);
      setForm((current) => ({ ...current, role: items[0] || "" }));
    });
    loadSignups();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedEvent = events.find((item) => item.id === form.eventId);
    await communityService.addVolunteerSignup(
      {
        ...form,
        eventTitle: selectedEvent?.title || "Community event",
      },
      user
    );
    setForm({ eventId: events[0]?.id || "", role: roles[0] || "", note: "" });
    loadSignups();
  };

  return (
    <main className="section page-shell community-layout">
      <section>
        <p className="eyebrow">Serve</p>
        <h1>Volunteer Signups</h1>
        <p className="muted">
          Choose an event, pick a role, and help the community run better programs.
        </p>

        <div className="feed-list">
          {signups.length === 0 ? (
            <div className="empty-state">No volunteer signups yet.</div>
          ) : (
            signups.map((signup) => (
              <article className="booking-card" key={signup.id}>
                <div>
                  <h3>{signup.role}</h3>
                  <p>{signup.eventTitle}</p>
                  <span>{signup.userName} · {new Date(signup.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="status-pill">Signed up</span>
              </article>
            ))
          )}
        </div>
      </section>

      <aside className="panel sticky-panel">
        <p className="eyebrow">Volunteer</p>
        <h2>Pick a role</h2>
        {isAuthenticated ? (
          <form className="panel-form flush-form" onSubmit={handleSubmit}>
            <label>
              Event
              <select
                value={form.eventId}
                onChange={(event) => setForm({ ...form, eventId: event.target.value })}
              >
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Role
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea
                rows="4"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="Availability or useful skills"
              />
            </label>
            <button className="primary-button full-button" type="submit">
              Sign up
            </button>
          </form>
        ) : (
          <p className="muted">
            <Link to="/login">Login</Link> to volunteer for an event.
          </p>
        )}
      </aside>
    </main>
  );
};

export default Volunteer;
