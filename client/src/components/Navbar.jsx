import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <button className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark">IYF</span>
          <span>Event Ticketing</span>
        </button>
        <div className="nav-links">
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/groups">Groups</NavLink>
          <NavLink to="/volunteer">Volunteer</NavLink>
          <NavLink to="/opportunities">Opportunities</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/create-event">Create</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <div className="nav-user">
                <span>{user?.name || "User"}</span>
              </div>
              <button className="danger-button small-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <button className="primary-button small-button" onClick={() => navigate("/register")}>
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
