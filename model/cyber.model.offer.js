const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offer_image: {
      type: String,
      required: true,
    },
  }
);


module.exports = mongoose.model("Offer", offerSchema);
