import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventCategories } from "../data/events";
import { useAuth } from "../context/AuthContext";
import eventService from "../services/eventService";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    price: "",
    capacity: "",
    category: "Conference",
    image: "",
  });

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const createdEvent = await eventService.createEvent(
      formData,
      user?.name || "Vibe Nation Organizer"
    );
    navigate(`/events/${createdEvent.id}`);
  };

  return (
    <main className="section page-shell">
      <div className="form-layout">
        <div>
          <p className="eyebrow">Organizer tools</p>
          <h1>Create a New Event</h1>
          <p className="muted">
            Publish a complete event listing with ticket price, capacity, venue,
            and a cover image.
          </p>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>
          <label>
            Event title
            <input name="title" required value={formData.title} onChange={handleChange} />
          </label>
          <div className="form-grid">
            <label>
              Date and time
              <input
                type="datetime-local"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
              />
            </label>
            <label>
              Category
              <select name="category" value={formData.category} onChange={handleChange}>
                {eventCategories
                  .filter((category) => category !== "All")
                  .map((category) => (
                    <option key={category}>{category}</option>
                  ))}
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              Ticket price (KES)
              <input
                type="number"
                min="0"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
              />
            </label>
            <label>
              Capacity
              <input
                type="number"
                min="1"
                name="capacity"
                required
                value={formData.capacity}
                onChange={handleChange}
              />
            </label>
          </div>
          <label>
            Location
            <input name="location" required value={formData.location} onChange={handleChange} />
          </label>
          <label>
            Cover image URL
            <input name="image" value={formData.image} onChange={handleChange} />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows="5"
              required
              value={formData.description}
              onChange={handleChange}
            />
          </label>
          <button className="primary-button full-button" type="submit">
            Publish event
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreateEvent;
