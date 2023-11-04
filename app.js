const express = require("express");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookies middlewares
app.use(cookieParser());

// import all routes
const home = require("./routes/home");

// router middleware
app.use("/api/v1", home);

// export app js
module.exports = app;
