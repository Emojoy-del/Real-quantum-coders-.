import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { user, logoutUser } = useAuth();

  return (
    <nav className="navbar">
      <h2>EventHub</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>

        <Link to="/create">Create Event</Link>

        <Link to="/dashboard">Dashboard</Link>

        {user ? (
          <>
            <button onClick={logoutUser} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;