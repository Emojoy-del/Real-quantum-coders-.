import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BookingForm from "../components/BookingForm";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import PageWrapper from "../components/PageWrapper";

import { getEventById } from "../services/eventService";
import { createBooking } from "../services/bookingService";

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getEventById(id);
        setEvent(data);
      } catch {
        setError("Failed to load event");
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  async function handleBooking(quantity) {
    setLoading(true);

    setMessage("");
    setError("");

    try {
      await createBooking({
        eventId: id,
        quantity: Number(quantity),
      });

      setMessage("Booking successful");
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <PageWrapper>
      {loading && <Loader />}

      {message && <Toast message={message} />}

      {error && <Toast message={error} type="error" />}

      {event && (
        <div className="card">
          <h2>{event.title}</h2>

          <p>{event.description}</p>

          <p>{event.location}</p>

          <p>Ksh {event.price}</p>

          <BookingForm onBook={handleBooking} />
        </div>
      )}
    </PageWrapper>
  );
}

export default EventDetails;