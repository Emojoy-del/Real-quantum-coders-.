import React, { useState } from 'react';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    price: '',
    category: 'Music'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Event Created:", formData);
    alert("Event Published Successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 lg:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">Create a New Event</h1>
          <p className="text-gray-500 mt-2">Fill in the details below to reach your audience.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Event Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Summer Beats 2024"
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
              <input 
                type="datetime-local" 
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Price ($)</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input 
                type="text" 
                placeholder="Venue name or address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Tell people why they should attend..."
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-200"
          >
            Publish Event
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;