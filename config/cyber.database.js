const mongoose = require("mongoose");
require("dotenv").config();

const databaseConnect = () => {
  mongoose
    .connect(process.env.MONGO_CLOUD_DATABASE_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Cyber Database Connected Successfully");
    })
    .catch((err) => {
      console.error("Cyber Database connection error:", err);
    });
};

module.exports = { databaseConnect };
