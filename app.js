const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookies middlewares
app.use(cookieParser());

// morgan middleware
app.use(morgan("tiny"));

// import all routes
const home = require("./routes/home");
const user = require("./routes/user");

// router middleware
app.use("/api/v1", home);
app.use("/api/v1", user);

// export app js
module.exports = app;
