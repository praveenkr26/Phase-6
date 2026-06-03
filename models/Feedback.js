const mongoose = require("mongoose");

// Defines the schema - how data is stored in MongoDB
const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    course: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      maxlength: [150, "Course name cannot exceed 150 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: function () {
        if (this.rating >= 4) return "positive";
        if (this.rating === 3) return "neutral";
        return "negative";
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Auto-calculate sentiment before saving
feedbackSchema.pre("save", function (next) {
  if (this.rating >= 4) this.sentiment = "positive";
  else if (this.rating === 3) this.sentiment = "neutral";
  else this.sentiment = "negative";
  next();
});

module.exports = mongoose.model("Feedback", feedbackSchema, "feedback");
