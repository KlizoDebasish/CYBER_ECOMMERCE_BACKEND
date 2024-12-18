
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_title: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
    },
    product_basePrice: {
      type: Number,
      required: true,
    },
    product_categories: {
      type: String,
      required: true,
    },
    product_badge: {
      type: String,
      required: true,
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
      }
    ],
    discount: {
      percentage: { type: Number, default: 0 },
      discountedPrice: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
