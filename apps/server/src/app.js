const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/users", require("./modules/users/user.routes"));
app.use("/api/events", require("./modules/events/event.routes"));
app.use("/api/guests", require("./modules/guests/guest.routes"));

module.exports = app;