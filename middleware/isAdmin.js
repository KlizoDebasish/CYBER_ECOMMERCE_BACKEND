isAdmin = (req, res, next) => {
  try {
    const role = req.role;

    if (!role || role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You must be an admin.!",
      });
    }
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error in authorization",
    });
  }
};

module.exports = isAdmin;
