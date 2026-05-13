const Event = require("../models/Event");


// CREATE EVENT
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, date, image } = req.body;

    const event = await Event.create({
      title,
      description,
      location,
      date,
      image,
      creator: req.user,
    });

    res.status(201).json({
      message: "Event created successfully 🎉",
      event,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET ALL EVENTS
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("creator", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET SINGLE EVENT
exports.getSingleEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("creator", "username email");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(event);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE EVENT
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Only creator can edit
    if (event.creator.toString() !== req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Event updated successfully ✨",
      updatedEvent,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE EVENT
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Only creator can delete
    if (event.creator.toString() !== req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      message: "Event deleted successfully 🗑️",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};