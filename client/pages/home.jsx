// Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Events
  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/events`
      );

      setEvents(res.data);
    } catch (err) {
      setError("Failed to load events 😢");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-950 text-white">

      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
          Discover Amazing Events 🎉
        </h1>

        <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-8">
          Book events, connect with people, and enjoy unforgettable experiences.
        </p>

        <Link
          to="/create-event"
          className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform duration-300"
        >
          Create Event 🚀
        </Link>
      </section>

      {/* Events Section */}
      <section className="px-6 pb-20">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Upcoming Events 📅
        </h2>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl text-center max-w-lg mx-auto">
            {error}
          </div>
        )}

        {/* No Events */}
        {!loading && events.length === 0 && (
          <p className="text-center text-gray-400">
            No events available yet 😶
          </p>
        )}

        {/* Event Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:scale-105 transition duration-300"
            >
              {/* Event Image */}
              <img
                src={
                  event.image ||
                  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
                }
                alt={event.title}
                className="w-full h-52 object-cover"
              />

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">
                  {event.title}
                </h3>

                <p className="text-gray-300 mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm text-gray-400 mb-5">
                  <p>📍 {event.location}</p>
                  <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                </div>

                <Link
                  to={`/events/${event._id}`}
                  className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;