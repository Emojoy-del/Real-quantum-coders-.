import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Home from "../pages/Home";
import Events from "../pages/Events";
import EventDetails from "../pages/EventDetails";
import CreateEvent from "../pages/CreateEvent";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import CommunityFeed from "../pages/CommunityFeed";
import Groups from "../pages/Groups";
import Opportunities from "../pages/Opportunities";
import Volunteer from "../pages/Volunteer";
import Profile from "../pages/Profile";
import Creators from "../pages/Creators";
import Notifications from "../pages/Notifications";
import Media from "../pages/Media";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:eventId" element={<EventDetails />} />
      <Route path="/feed" element={<CommunityFeed />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="/volunteer" element={<Volunteer />} />
      <Route path="/creators" element={<Creators />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/media" element={<Media />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
