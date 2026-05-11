import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import hubService from "../services/hubService";

const Media = () => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", image: "", caption: "" });

  const loadMedia = () => hubService.getMedia().then(setItems);

  useEffect(() => {
    loadMedia();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await hubService.addMedia(form, user);
    setForm({ title: "", image: "", caption: "" });
    loadMedia();
  };

  return (
    <main className="section page-shell community-layout">
      <section>
        <p className="eyebrow">Memories</p>
        <h1>Media Wall</h1>
        <p className="muted">
          Photos, highlights, and memories from events and community activities.
        </p>

        <div className="media-grid">
          {items.map((item) => (
            <article className="media-card" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div>
                <h2>{item.title}</h2>
                <p>{item.caption}</p>
                <strong>{item.author}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="panel sticky-panel">
        <p className="eyebrow">Upload</p>
        <h2>Share media</h2>
        {isAuthenticated ? (
          <form className="panel-form flush-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label>
              Image URL
              <input
                required
                value={form.image}
                onChange={(event) => setForm({ ...form, image: event.target.value })}
              />
            </label>
            <label>
              Caption
              <textarea
                required
                rows="4"
                value={form.caption}
                onChange={(event) => setForm({ ...form, caption: event.target.value })}
              />
            </label>
            <button className="primary-button full-button" type="submit">
              Share media
            </button>
          </form>
        ) : (
          <p className="muted">Login to share event photos or highlight links.</p>
        )}
      </aside>
    </main>
  );
};

export default Media;
