isUser = (req, res, next) => {
    try {
      const role = req.role;
  
      if (role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Users only!",
        });
      }
      next();
    } catch (error) {
      console.error("Error in isUser middleware:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error in authorization",
      });
    }
  };
  
  module.exports = isUser;