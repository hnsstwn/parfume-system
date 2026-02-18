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
const logger = require('./utils/logger');

// ROUTES
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const reportRoutes = require('./routes/reports.routes'); // ⬅️ PASTIKAN NAMA FILE INI SAMA

// ===============================
const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// RATE LIMIT (ANTI SPAM)
// ===============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  message: "Too many requests, slow down."
});
app.use(limiter);

// ===============================
// ROOT
// ===============================
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Parfume System API Running",
    version: "2.0 Production"
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
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
