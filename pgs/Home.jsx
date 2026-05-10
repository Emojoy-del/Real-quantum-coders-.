import React from 'react';

const Home = () => {
  const featuredEvents = [
    { id: 1, title: "Midnight Jazz Festival", date: "Oct 12", price: "$45", image: "https://images.unsplash.com/photo-1514525253344-99a42d74051c?w=400" },
    { id: 2, title: "Tech Innovators Summit", date: "Nov 05", price: "$120", image: "https://images.unsplash.com/photo-1540575861501-7ad060e39fe6?w=400" },
    { id: 3, title: "Street Food Carnival", date: "Sept 20", price: "Free", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-indigo-600 py-20 px-6 text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Discover Amazing Events</h1>
        <p className="text-xl opacity-90 mb-8">Don't miss out on the best experiences around you.</p>
        <div className="max-w-md mx-auto flex gap-2">
          <input 
            type="text" 
            placeholder="Search events, artists, or cities..." 
            className="w-full px-4 py-3 rounded-lg text-gray-800 focus:outline-none"
          />
          <button className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition">Search</button>
        </div>
      </section>

      {/* Event Grid */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <img src={event.image} alt={event.title} className="h-48 w-full object-cover" />
              <div className="p-6">
                <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">{event.date}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{event.title}</h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-600 font-medium">{event.price}</span>
                  <button className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded hover:bg-indigo-50 transition">Get Tickets</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;