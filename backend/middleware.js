const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

/**
 * authenticate — verifies JWT and attaches userId + role to req.
 * Works for both volunteers (role: "volunteer") and organisations (role: "Organisation").
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * authenticateOrg — same as authenticate but additionally
 * enforces that the caller is an Organisation.
 */
function authenticateOrg(req, res, next) {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    // If authenticate already sent a response (401), do not proceed
    if (res.headersSent) return;
    if (req.userRole !== "Organisation") {
      return res.status(403).json({ message: "Access restricted to organisations" });
    }
    next();
  });
}

/**
 * authenticateUser — enforces that caller is a volunteer.
 */
function authenticateUser(req, res, next) {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    if (res.headersSent) return;
    if (req.userRole !== "volunteer") {
      return res.status(403).json({ message: "Access restricted to volunteers" });
    }
    next();
  });
}

module.exports = { authenticate, authenticateOrg, authenticateUser };
