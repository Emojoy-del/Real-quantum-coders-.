import { seedEvents } from "../data/events";

const EVENTS_KEY = "iyf_events";

const readSavedEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
  } catch {
    return [];
  }
};

const writeSavedEvents = (events) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const eventService = {
  getEvents: async () => {
    const savedEvents = readSavedEvents();
    return [...savedEvents, ...seedEvents].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  },

  getEventById: async (eventId) => {
    const events = await eventService.getEvents();
    return events.find((event) => event.id === eventId) || null;
  },

  createEvent: async (eventData, organizer = "IYF Organizer") => {
    const savedEvents = readSavedEvents();
    const nextEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      price: Number(eventData.price || 0),
      capacity: Number(eventData.capacity || 100),
      organizer,
      image:
        eventData.image ||
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    };

    writeSavedEvents([nextEvent, ...savedEvents]);
    return nextEvent;
  },
};

export default eventService;
