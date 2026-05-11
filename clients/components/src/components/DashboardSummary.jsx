import { useEffect, useState } from "react";

import BookingList from "../components/BookingList";
import DashboardSummary from "../components/DashboardSummary";
import UserInfoCard from "../components/UserInfoCard";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import PageWrapper from "../components/PageWrapper";

import { getUserBookings } from "../services/bookingService";

import { useAuth } from "../hooks/useAuth";

function Dashboard() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUserBookings();
        setBookings(data);
      } catch {
        setError("Failed to load dashboard");
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <PageWrapper>
      <h1>Dashboard</h1>

      <UserInfoCard user={user} />

      <DashboardSummary total={bookings.length} />

      {loading && <Loader />}

      {error && <Toast message={error} type="error" />}

      <BookingList bookings={bookings} />
    </PageWrapper>
  );
}

export default Dashboard;