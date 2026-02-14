/**
 * 🔒 Admin Middleware
 * Ensures that the user is authenticated and has the "admin" role.
 */
const admin = (req, res, next) => {
  // ✅ Must be authenticated first
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // ✅ Check role
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admins only",
    });
  }

  // ✅ Authorized
  next();
};

export default admin;
