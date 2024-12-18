const twilio = require("twilio");
require("dotenv").config();

const sid = process.env.TWILIO_SID.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
const client = new twilio(sid, authToken);

// console.log( process.env.TWILIO_SID,
//   process.env.TWILIO_AUTH_TOKEN,  process.env.TWILIO_PHONE_NUMBER)

// Function to send OTP via SMS
const sendOTP = async (fullname, phoneNumber, otp) => {
  try {
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error(
        "Invalid phone number format. Please provide a valid 10-digit number."
      );
    }

    // If the phone number is valid, construct the message body
    const messageBody = `OTP: ${otp} \n\nHey ${fullname} 😎 \n\nWelcome to Cyber! 🤗 \n\n!Important: Do not share your OTP with others. \n\nBest regards:\n@Amardeep @Debasish @Pankaj\nThanks for choosing Cyber\nHappy Shopping 🛒`;

    // Send OTP via Twilio (now using the phone number as is)
    const response = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phoneNumber.trim()}`, // Send OTP to the phone number with country code (e.g., +91 for India)
    });

    // console.log("Twilio response:", response);
  } catch (error) {
    console.error("Error details:", error); // Log full error
    throw new Error(`Error sending OTP: ${error.message}`);
  }
};

// Function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

module.exports = { sendOTP, generateOTP };
