// ===============================
// LOAD ENV
// ===============================
require('dotenv').config();

// ===============================
// IMPORT
// ===============================
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');

// ROUTES
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const reportRoutes = require('./routes/reports.routes');

// ===============================
const app = express();

// ===============================
// SECURITY MIDDLEWARE
// ===============================
app.use(helmet()); // Secure HTTP headers
app.use(cors());
app.use(express.json());

// ===============================
// REQUEST LOGGING (PRODUCTION READY)
// ===============================
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// ===============================
// RATE LIMIT (ANTI SPAM / DDOS BASIC)
// ===============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});

app.use(limiter);

// ===============================
// ROOT CHECK
// ===============================
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Parfume System API Running",
    version: "2.0 Production Secure",
    environment: process.env.NODE_ENV || "development"
  });
});

// ===============================
// ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  logger.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
