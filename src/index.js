require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");

// Routes
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const materialRoutes = require("./routes/materials");
const moduleRoutes = require("./routes/modules");
//const projectRoutes = require("./routes/projects");
const pricingRoutes = require("./routes/pricing");
const app = express();

// Mongo Connection
connectDB();

// Middlewares
app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(morgan("dev"));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Eyce Designer API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/materials", materialRoutes);

app.use("/api/modules", moduleRoutes);

// app.use("/api/projects", projectRoutes);

app.use("/api/pricing", pricingRoutes);

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🚀 Eyce Designer API Running
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
  `);
});