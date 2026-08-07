const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/event", require("./modules/events/event.routes"));

module.exports = app;
