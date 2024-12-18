const mongoose = require("mongoose");
require("dotenv").config();

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index to automatically delete OTPs after expiration
otpSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: process.env.OTP_EXPIRATION_TIME * 60 }
);

module.exports  = mongoose.model('Otp', otpSchema);