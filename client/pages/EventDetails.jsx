import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/events/${id}`);

        if (!res.ok) {
          throw new Error("Failed to fetch event details");
        }

        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, API_URL]);

  const handleBookEvent = () => {
    // You can replace this with real booking logic
    alert("Event booked successfully!");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Loading event details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-black text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Event Image */}
      <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image Available
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-gray-600 mt-2">{event.description}</p>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Date:</strong>{" "}
            {new Date(event.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Location:</strong> {event.location}
          </p>
          <p>
            <strong>Organizer:</strong> {event.organizer || "Admin"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleBookEvent}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Book Event
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;