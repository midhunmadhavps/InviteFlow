const eventService = require("./event.service");

createEvent = async (req, res) => {

    try {
        const result = await eventService.createEvent(req.body);

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

eventTypes = async (req, res) => {

    try {
        const result = await eventService.eventTypes();

        return res.status(200).json({
            success: true,
            message: "Event Type listed successfully.",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
  createEvent,eventTypes
};