const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    feedback_description: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, // Poor
      max: 5, // Excellent
    },
    feedback_images: {
      type: [String],
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
