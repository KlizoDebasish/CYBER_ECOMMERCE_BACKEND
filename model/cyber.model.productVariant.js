const  mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  product_brand: {
    type: String,
    required: true,
  },
  product_storage: {
    type: String,
    required: true,
  },
  product_color: {
    type: String,
    required: true,
  },
  product_additional_price: {
    type: Number,
    default: 0,
  },
  product_stock: {
    type: Number,
    default: 0,
  },

  product_images: {
    type: [String],
    required: true,
  },
  product_screentype: {
    type: String,
    required: true,
  },
  product_cpu: {
    type: String,
    required: true,
  },
  product_cores: {
    type: Number,
    required: true,
  },
  product_main_camera: {
    type: String,
    required: true,
  },
  product_front_camera: {
    type: String,
    required: true,
  },
  product_battery_capacity: {
    type: String,
    required: true,
  },

  //---------------------------------------------------------------
  product_delivery_time: {
    type: String,
    required: true,
  },

  product_guarantee: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("ProductVariant", productVariantSchema);
