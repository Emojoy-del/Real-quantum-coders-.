import React, { useEffect, useState } from "react";
import hubService from "../services/hubService";

const Notifications = () => {
  const [items, setItems] = useState([]);

  const loadNotifications = () => hubService.getNotifications().then(setItems);

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await hubService.markNotificationRead(id);
    loadNotifications();
  };

  return (
    <main className="section page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stay updated</p>
          <h1>Notifications</h1>
          <p className="muted">
            Alerts for tickets, volunteer slots, opportunities, and community activity.
          </p>
        </div>
      </div>

      <div className="opportunity-list">
        {items.map((item) => (
          <article className={`opportunity-card ${item.read ? "read-card" : ""}`} key={item.id}>
            <div>
              <span className="pill">{item.type}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <button
              className={item.read ? "ghost-light-button" : "primary-button"}
              onClick={() => markRead(item.id)}
            >
              {item.read ? "Read" : "Mark read"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Notifications;
