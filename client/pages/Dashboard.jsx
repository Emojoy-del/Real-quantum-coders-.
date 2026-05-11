import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/events`);

      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Search filter
  useEffect(() => {
    const filtered = events.filter((event) =>
      event.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [search, events]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-10 bg-gray-300 w-1/3 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={fetchEvents}
          className="mt-4 px-4 py-2 bg-black text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <button
          onClick={() => navigate("/create-event")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Event
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full md:w-1/2 p-3 border rounded-lg focus:outline-none focus:ring"
      />

      {/* Events */}
      {filteredEvents.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">
          No events found.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Image */}
              <div className="h-40 bg-gray-200">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h2 className="font-semibold text-lg">{event.title}</h2>

                <p className="text-sm text-gray-600 mt-1">
                  {event.description?.slice(0, 80)}...
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  📍 {event.location || "Unknown"}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="px-3 py-1 bg-black text-white text-sm rounded"
                  >
                    View
                  </button>

                  <button
                    onClick={() => navigate(`/events/edit/${event._id}`)}
                    className="px-3 py-1 bg-gray-200 text-sm rounded"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;