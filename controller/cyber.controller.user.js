const userModel = require("../model/cyber.model.user");
const jwt = require("jsonwebtoken");
const getDataUri = require("../utils/dataUriParser.js");
const cloudinary = require("../config/cloudinary.config.js");
require("dotenv").config();
const { sendOTP, generateOTP } = require("../utils/twilio.otp.js");
const otpModel = require("../model/otp.model.js");

// Register
exports.signup = async (req, res) => {
  try {
    const { fullname, email, phone } = req.body;

    if (!phone || phone.trim() === "") {
      return res.status(422).json({
        success: false,
        message: "Phone number is required and cannot be empty",
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(422).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      if (email === "") {
        return res.status(422).json({
          success: false,
          message: "Email cannot be empty or just spaces",
        });
      }

      // Check if email already exists
      const existingUserWithEmail = await userModel.findOne({
        email: email,
      });
      if (existingUserWithEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already in use! try different email.",
        });
      }
    }

    // Validate phone number (should be exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(422).json({
        success: false,
        message: "Phone must be a valid 10-digit number",
      });
    }

    // Check if phone number already exists
    const existingUserWithPhone = await userModel.findOne({
      phone: phone.trim(),
    });
    if (existingUserWithPhone) {
      return res.status(400).json({
        success: false,
        message: "You Are a Cyber User. Please log in!",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP temporarily in the database
    const otpData = new otpModel({
      phone: phone.trim(),
      email: email ? email.trim() : "Cyber@example.com",
      otp,
      fullname: fullname ? fullname.trim() : "Cyber user",
      timestamp: Date.now(),
    });

    await otpData.save();

    // Send OTP via Twilio
    await sendOTP(fullname, phone.trim(), otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent! Please verify to proceed.",
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// OTP Verification: Validate OTP entered by the user while registering
exports.verifyOtpforRegister = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate OTP and phone number
    if (!phone || !otp) {
      return res.status(422).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Find OTP from database by phone number
    const otpData = await otpModel
      .findOne({ phone: phone })
      .sort({ timestamp: -1 });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP or Phone number, try again",
      });
    }

    // Check if OTP is expired
    const expirationTime =
      parseInt(process.env.OTP_EXPIRATION_TIME, 10) * 60 * 1000; // OTP expiration time in milliseconds
    const isExpired = Date.now() - otpData.timestamp > expirationTime;

    if (isExpired) {
      await otpModel.deleteOne({ phone: phone.trim() });
      return res.status(400).json({
        success: false,
        message: "OTP expired! Please request a new one.",
      });
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP! Please try again.",
      });
    }

    // OTP is valid, save user data to the database
    const newUser = new userModel({
      fullname: otpData.fullname ? otpData.fullname : "Cyber user",
      email: otpData.email ? otpData.email.trim() : null,
      phone: phone,
      isLoggedIn: true,
    });

    newUser.isLoggedIn = true;
    await newUser.save();

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res
      .status(201)
      .cookie("authToken", token, {
        // httpOnly: false,
        // secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      })
      .json({
        success: true,
        message: `${newUser.fullname} 😀 welcome to Cyber!`,
        newUser,
        token,
      });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Or not a Verfied number",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(422).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Check if user is registered in the system
    const user = await userModel.findOne({ phone: phone.trim() });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Are you Sure! Please sign up.",
      });
    }

    // Attempt to send OTP
    try {
      const otp = generateOTP();

      // Store OTP in database
      const otpData = new otpModel({
        phone: phone.trim(),
        otp,
        timestamp: Date.now(),
      });

      await otpData.save();

      // Send OTP via Twilio
      await sendOTP(user.fullname, phone.trim(), otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent! Please verify to proceed.",
      });
    } catch (error) {
      // Handle errors from Twilio
      if (error.message.includes("unverified")) {
        return res.status(400).json({
          success: false,
          message:
            "Not a verified number. Please verify it from Debasish 🙂",
        });
      }

      // General error handling
      console.error("Error sending OTP:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error during login process:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server issue. Please try again after a few minutes.",
    });
  }
};

// OTP verification: Validate OTP entered by the user while login
exports.verifyOtpforlogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(422).json({
        success: false,
        message: "all fields are required",
      });
    }

    // Find OTP from database by phone number
    const otpData = await otpModel
      .findOne({ phone: phone.trim() })
      .sort({ timestamp: -1 });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "Hmmm... Invalid Phone! Please check",
      });
    }

    // Check if OTP is expired
    const expirationTime =
      parseInt(process.env.OTP_EXPIRATION_TIME, 10) * 60 * 1000; // Convert to milliseconds
    const isExpired = Date.now() - otpData.timestamp > expirationTime;

    if (isExpired) {
      // OTP expired, delete it from the database
      await otpModel.deleteOne({ phone: phone.trim() });
      return res.status(400).json({
        success: false,
        message: "OTP expired! Please request a new one.",
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP! Please try again.",
      });
    }

    // OTP is valid, now generate JWT token
    const user = await userModel.findOne({ phone: phone.trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Are you Sure! Please Sign-Up.",
      });
    }

    user.isLoggedIn = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res
      .status(200)
      .cookie("authToken", token, {
        // httpOnly: true,
        // secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: `Welcome back, ${user.fullname} 👋`,
        user,
        token,
      });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// logout the user
exports.logout = async (req, res) => {
  try {
    const token =
      req.cookies.authToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Already Logged Out",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the user by ID and update the isLoggedIn field to false
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isLoggedIn = false;
    await user.save();

    return res
      .status(200)
      .cookie("authToken", "", {
        httpOnly: true,
        maxAge: 0,
      })
      .json({
        success: true,
        message: "Logged out. See you soon!",
      });
  } catch (error) {
    console.error("Error during user logout:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { fullname, email } = req.body;
    const file = req.file;

    let user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullname) user.fullname = fullname.trim();
    if (email) user.email = email.trim();

    if (file) {
      try {
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            folder: "user_Profilephoto",
            resource_type: "image",
          }
        );

        if (cloudResponse && cloudResponse.secure_url) {
          // If there's a previous profile photo, delete it from Cloudinary
          if (user.profilePhoto) {
            const previousImageId = user.profilePhoto
              .split("/")
              .pop()
              .split(".")[0];

            const deleteResponse = await cloudinary.uploader.destroy(
              `user_Profilephoto/${previousImageId}`,
              {
                resource_type: "image",
              }
            );

            if (deleteResponse.result !== "ok") {
              console.error(
                "Failed to delete previous profile photo from Cloudinary:",
                deleteResponse
              );
            }
          }

          // Update the user profile photo with the new one
          user.profilePhoto = cloudResponse.secure_url;
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile photo to Cloudinary",
        });
      }
    }

    await user.save();

    const { _id, phone, profilePhoto, address } = user;

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user: {
        id: _id,
        fullname: user.fullname,
        email: user.email,
        phone,
        profilePhoto,
        address,
      },
    });
  } catch (error) {
    console.error("Error during profile update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// add address
exports.createAddress = async (req, res) => {
  try {
    const userId = req.id;
    const { street, city, state, zipCode, country, landMark, type_Of_Address } = req.body;

    if (!(street && city && state && zipCode && country && landMark)) {
      return res.status(400).json({
        success: false,
        message: "All address fields are mandatory",
      });
    }

    const requiredFields = [
      { key: "Street", value: street },
      { key: "City", value: city },
      { key: "Land-mark", value: landMark },
      { key: "State", value: state },
      { key: "Country", value: country },
    ];

    for (const field of requiredFields) {
      if (
        typeof field.value !== "string" ||
        field.value.trim() === "" ||
        !field.value
      ) {
        return res.status(400).json({
          success: false,
          message: `${field.key} cannot be empty`,
        });
      }
    }

    const newAddress = {
      street: street.trim(),
      city: city.trim(),
      landMark: landMark.trim(),
      state: state.trim(),
      country: country.trim(),
      zipCode: zipCode,
      type_Of_Address: type_Of_Address,
    };

    let user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for duplicate addresses
    // const isDuplicateStreet = user.address.some((address) => {
    //   return (
    //     address.street.toLowerCase() === newAddress.street.toLowerCase()
    //   );
    // });

    // if (isDuplicateStreet) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Street already exists",
    //   });
    // }

    // const isDuplicateCity = user.address.some((address) => {
    //   return (
    //     address.city.toLowerCase() === newAddress.city.toLowerCase()
    //   );
    // });

    // if (isDuplicateCity) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "City already exists",
    //   });
    // }

    const isDuplicateLandmark = user.address.some((address) => {
      return (
        address.landMark.toLowerCase() === newAddress.landMark.toLowerCase()
      );
    });

    if (isDuplicateLandmark) {
      return res.status(400).json({
        success: false,
        message: "LandMark already exists",
      });
    }

    user.address.unshift(newAddress);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address Created",
      user: user,
    });
  } catch (error) {
    console.error("Error during address creation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// modify a single address
exports.modifyAddress = async (req, res) => {
  try {
    const userId = req.id;
    const { addressId } = req.params;
    // console.log(req.params.addressId)
    // console.log(req.body)
    const { street, city, state, zipCode, country, landMark, type_Of_Address } = req.body;

    let user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const addressIndex = user.address.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update only the provided fields
    const updatedAddress = user.address[addressIndex];

    if (street && street.trim()) updatedAddress.street = street.trim();
    if (landMark && landMark.trim()) updatedAddress.landMark = landMark.trim();
    if (city && city.trim()) updatedAddress.city = city.trim();
    if (state && state.trim()) updatedAddress.state = state.trim();
    if (country && country.trim()) updatedAddress.country = country.trim();
    if (zipCode) updatedAddress.zipCode = zipCode;
    if (type_Of_Address && type_Of_Address.trim())
      updatedAddress.type_Of_Address = type_Of_Address.trim();

    // Check for duplicate address
    const isDuplicateAddress = user.address.some((address, idx) => {
      return (
        idx !== addressIndex &&
        address.street.toLowerCase() === updatedAddress.street.toLowerCase() &&
        address.city.toLowerCase() === updatedAddress.city.toLowerCase() &&
        address.landMark.toLowerCase() === updatedAddress.landMark.toLowerCase()
      );
    });

    if (isDuplicateAddress) {
      return res.status(400).json({
        success: false,
        message: "Address already exists",
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated",
      user
    });
  } catch (error) {
    console.error("Error during address update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// all addresses
exports.getAddress = async (req, res) => {
  try {
    const userId = req.id;

    let user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User addresses fetched successfully",
      addresses: user.address,
    });
  } catch (error) {
    console.error("Error during address fetch:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// remove address
exports.removeAddress = async (req, res) => {
  try {
    const userId = req.id;
    const { addressId } = req.params;

    let user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the address index by the unique addressId
    const addressIndex = user.address.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    user.address.splice(addressIndex, 1);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address removed!",
      user: {
        id: user._id,
        addresses: user.address,
      },
    });
  } catch (error) {
    console.error("Error during address deletion:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// single user Details
exports.getSingleUserDetails = async (req, res) => {
  try {
    const token =
      req.cookies.authToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token Not Found!",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: `hay! ${user.fullname} here is your details.`,
      user,
    });
  } catch (error) {}
};
