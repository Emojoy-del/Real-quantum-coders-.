import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Loader from "../components/Loader";
import Toast from "../components/Toast";
import PageWrapper from "../components/PageWrapper";

import { login } from "../services/authService";

import { useAuth } from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();

  const { loginUser } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "", 
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);

    setMessage("");
    setError("");

    try {
      const data = await login(form);

      loginUser(data);

      setMessage("Login successful");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <PageWrapper>
      <div className="form-container">
        <h2>Login</h2>

        {message && <Toast message={message} />}

        {error && <Toast message={error} type="error" />}

        {loading && <Loader />}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </PageWrapper>
  );
}

export default Login;