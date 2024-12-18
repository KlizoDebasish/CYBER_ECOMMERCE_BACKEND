const jwt = require("jsonwebtoken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    // Retrieve token from cookies or Authorization header
    const token = req.cookies.authToken || req.headers.authorization?.split(" ")[1];

    // console.log("req.cookies.authToken",req.cookies.authToken);
    // console.log("req.headers.authorization",req.headers.authorization?.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid Token",
        success: false,
      });
    }

    // Attach user details to the request object
    req.id = decoded.id;
    req.role = decoded.role;

    next();
  } catch (error) {
    console.error("Error in isAuthenticated middleware:", error.message);
    return res.status(500).json({
      message: "Internal server error in authentication",
      success: false,
    });
  }
};
