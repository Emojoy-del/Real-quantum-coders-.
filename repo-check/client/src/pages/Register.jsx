import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "attendee",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    login(form);
    navigate("/dashboard");
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Join Vibe Nation events</p>
        <h1>Create account</h1>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Account type
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="attendee">Attendee</option>
            <option value="organizer">Organizer</option>
          </select>
        </label>
        <button className="primary-button full-button" type="submit">
          Register
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default Register;
