const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");
const db = require("../config/db");

const verifyToken = async (req, res, next) => {
  try {
    // ===============================
    // GET TOKEN FROM HEADER
    // ===============================
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return error(res, "Access Denied. No token provided.", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      return error(res, "Invalid authorization format.", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return error(res, "Token missing.", 401);
    }

    // ===============================
    // VERIFY JWT
    // ===============================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ===============================
    // CHECK USER STILL EXISTS
    // ===============================
    const user = await db.query(
      "SELECT id, role, name FROM users WHERE id = $1",
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return error(res, "User no longer exists.", 401);
    }

    // ===============================
    // ATTACH USER TO REQUEST
    // ===============================
    req.user = {
      id: user.rows[0].id,
      role: user.rows[0].role,
      name: user.rows[0].name
    };

    next();

  } catch (err) {
    return error(res, "Invalid or expired token.", 401);
  }
};

module.exports = verifyToken;
