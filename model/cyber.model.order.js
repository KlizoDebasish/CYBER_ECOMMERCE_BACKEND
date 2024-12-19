const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: {
    type: Array,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  address: {
    type: Object,
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ["Processing", "Delivered", "Cancelled"],
    default: "Processing",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  payment: {
    // for COD payment confirmation
    type: Boolean,
    default: false,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Failed", "Paid"],
    default: "Pending",
  },
  deliveryDate: {
    type: String,
    default: null,
  },
  shippingMethod: {
    type: String,
    enum: ["Free Delivery", "Quick Delivery", "Scheduled Delivery"]
  },
});

module.exports = mongoose.model("Order", orderSchema);
