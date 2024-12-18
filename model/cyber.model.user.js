const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    profilePhoto: {
      type: String,
      default:
        "https://t3.ftcdn.net/jpg/00/64/67/52/360_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg",
      trim: true,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    address: [
      {
        street: {
          type: String,
        },
        city: {
          type: String,
        },
        landMark : {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: String,
        },
        zipCode: {
          type: Number,
        },
        type_Of_Address: {
          type: String,
          default: "Home",
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
