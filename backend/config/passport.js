const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const pool = require("./db");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://parfume-system-production.up.railway.app/api/auth/google/callback"
          : "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // cek user
        let user = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        // kalau belum ada → buat user baru
        if (user.rows.length === 0) {
          const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
            [name, email, "google-auth", "user"]
          );

          user = newUser;
        }

        const token = jwt.sign(
          { id: user.rows[0].id, role: user.rows[0].role },
          JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          role: user.rows[0].role,
          token
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
