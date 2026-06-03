// ============================================
// Student Feedback Manager - Express.js Server
// ============================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const {
  connectWithRetry,
  registerMongoEvents,
  getConnectionStateLabel,
} = require("./db/connect");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/student_feedback";
const isVercel = Boolean(process.env.VERCEL);

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
// Serve static frontend from the `frontend` folder inside backend
app.use(express.static(path.join(__dirname, "frontend")));

// ==========================================
// MONGODB CONNECTION
// ==========================================
registerMongoEvents();
connectWithRetry(MONGO_URI, { maxRetries: 5, baseDelayMs: 2000 }).then((connected) => {
  if (!connected) {
    console.log("💡 Tip: Check your Atlas IP whitelist, username/password, and MONGO_URI in .env");
  }
});

// ==========================================
// API ROUTES
// ==========================================
const feedbackRoutes = require("./routes/feedback");
app.use("/api/feedback", feedbackRoutes);

// API health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running! 🚀",
    mongodb: getConnectionStateLabel(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// FRONTEND ROUTES - Serve React/HTML
// ==========================================
// For any route not starting with /api, serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error",
  });
});

// ==========================================
// SERVER START
// ==========================================
function startServer(port) {
  const server = app.listen(port, () => {
    console.log("\n============================================");
    console.log("🎓 Student Feedback Manager");
    console.log("============================================");
    console.log(`🚀 Server running at: http://localhost:${port}`);
    console.log(`📡 API endpoint: http://localhost:${port}/api/feedback`);
    console.log(`❤️  Health check: http://localhost:${port}/api/health`);
    console.log("============================================\n");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.log(`⚠️  Port ${port} is busy, trying ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error("❌ Server failed to start:", error.message);
  });

  return server;
}

if (require.main === module && !isVercel) {
  startServer(PORT);
}

module.exports = app;
