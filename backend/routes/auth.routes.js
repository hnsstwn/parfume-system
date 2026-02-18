const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");

const pool = require("../config/db");
const { success, error } = require("../utils/response");
const { validate } = require("../middleware/validation");

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


// ================= REGISTER =================
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password minimum 6 characters")
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const checkUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (checkUser.rows.length > 0) {
        return error(res, "Email already registered", 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)",
        [name, email, hashedPassword, "user"]
      );

      return success(res, null, "Register successful", 201);

    } catch (err) {
      return error(res, "Server error", 500, err.message);
    }
  }
);


// ================= LOGIN =================
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required")
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (user.rows.length === 0) {
        return error(res, "User not found", 404);
      }

      const validPassword = await bcrypt.compare(
        password,
        user.rows[0].password
      );

      if (!validPassword) {
        return error(res, "Wrong password", 401);
      }

      const token = jwt.sign(
        { id: user.rows[0].id, role: user.rows[0].role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      return success(res, {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
        token
      }, "Login successful");

    } catch (err) {
      return error(res, "Server error", 500, err.message);
    }
  }
);


// ================= GOOGLE LOGIN =================
router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return error(res, "Google credential required", 400);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // If user not exists → create
    if (user.rows.length === 0) {
      const result = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
        [name, email, "google-auth", "user"]
      );
      user = result;
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return success(res, {
      id: user.rows[0].id,
      name: user.rows[0].name,
      email: user.rows[0].email,
      role: user.rows[0].role,
      token
    }, "Google login successful");

  } catch (err) {
    return error(res, "Google authentication failed", 401, err.message);
  }
});


// ================= FORGOT PASSWORD =================
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required")],
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (user.rows.length === 0) {
        return error(res, "Email not found", 404);
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const expireTime = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        "UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE email=$3",
        [hashedToken, expireTime, email]
      );

      const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

      return success(
        res,
        process.env.NODE_ENV === "development" ? { resetLink } : null,
        "Reset link generated"
      );

    } catch (err) {
      return error(res, "Server error", 500, err.message);
    }
  }
);


module.exports = router;
