const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Feedback = require("../models/Feedback");

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// ==========================================
// GET /api/feedback - Fetch all feedback
// ==========================================
router.get("/", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "MongoDB is not connected. Feedback cannot be loaded from the database right now.",
      });
    }

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? (feedbacks.reduce((sum, f) => sum + Number(f.rating || 0), 0) / total).toFixed(1)
        : 0;
    const positive = feedbacks.filter((f) => f.sentiment === "positive").length;
    const neutral = feedbacks.filter((f) => f.sentiment === "neutral").length;
    const negative = feedbacks.filter((f) => f.sentiment === "negative").length;

    res.status(200).json({
      success: true,
      count: total,
      stats: { avgRating, positive, neutral, negative },
      data: feedbacks,
    });
  } catch (error) {
    console.error("GET /api/feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error - failed to fetch feedback",
      error: error.message,
    });
  }
});

// ==========================================
// POST /api/feedback - Save new feedback
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { name, course, rating, comment } = req.body;

    // Basic validation
    if (!name || !course || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, course, rating, comment",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "MongoDB is not connected. Feedback could not be saved to the database.",
      });
    }

    // Naya Feedback document banao aur MongoDB mein save karo
    const newFeedback = new Feedback({ name, course, rating, comment });
    const validationError = newFeedback.validateSync();
    if (validationError) {
      const messages = Object.values(validationError.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }

    const savedFeedback = await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback successfully saved to MongoDB!",
      data: savedFeedback,
    });
  } catch (error) {
    // Mongoose validation error handle karo
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }
    console.error("POST /api/feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error - failed to save feedback",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE /api/feedback/:id - Delete a feedback
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "MongoDB is not connected. Feedback could not be deleted.",
      });
    }

    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    res.status(200).json({ success: true, message: "Feedback deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// GET /api/feedback/stats - Return stats only
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "MongoDB is not connected. Stats cannot be loaded.",
      });
    }

    const total = await Feedback.countDocuments();
    const result = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]);
    res.json({ success: true, total, stats: result[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
