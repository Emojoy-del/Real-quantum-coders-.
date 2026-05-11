import { useState } from "react";

import Loader from "../components/Loader";
import Toast from "../components/Toast";
import PageWrapper from "../components/PageWrapper";

import { createEvent } from "../services/eventService";

function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    setMessage("");
    setError("");

    try {
      await createEvent(form);

      setMessage("Event created successfully");

      setForm({
        title: "",
        description: "",
        location: "",
        price: "",
      });
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <PageWrapper>
      <div className="card">
        <h2>Create Event</h2>

        {message && <Toast message={message} />}

        {error && <Toast message={error} type="error" />}

        {loading && <Loader />}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
          />

          <button type="submit">Create Event</button>
        </form>
      </div>
    </PageWrapper>
  );
}

export default CreateEvent;