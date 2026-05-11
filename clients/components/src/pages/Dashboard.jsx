import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../context/AuthContext";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import PageWrapper from "../components/PageWrapper";
import BookingList from "../components/BookingList";
import DashboardSummary from "../components/DashboardSummary";
import UserInfoCard from "../components/UserInfoCard";

import { getUserBookings } from "../services/bookingService";

function Dashboard() {
  const { user } = useContext(AuthContext);

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

      {error && <ErrorMessage message={error} />}

      <BookingList bookings={bookings} />
    </PageWrapper>
  );
}

export default Dashboard;