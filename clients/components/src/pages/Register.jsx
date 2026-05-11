import { useState } from "react";

import Loader from "../components/Loader";
import Toast from "../components/Toast";
import PageWrapper from "../components/PageWrapper";

import { register } from "../services/authService";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
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
      await register(form);

      setMessage("Registration successful");

      setForm({
        name: "",
        email: "",
        password: "",
      });
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <PageWrapper>
      <div className="card">
        <h2>Register</h2>

        {message && <Toast message={message} />}

        {error && <Toast message={error} type="error" />}

        {loading && <Loader />}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit">Register</button>
        </form>
      </div>
    </PageWrapper>
  );
}

export default Register;