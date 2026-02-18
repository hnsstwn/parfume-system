// ===============================
// LOAD ENV (WAJIB PALING ATAS)
// ===============================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// ===============================
// IMPORT ROUTES
// ===============================
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const reportRoutes = require('./routes/report.routes');
const transactionRoutes = require('./routes/transaction.routes');

// ===============================
// INIT APP
// ===============================
const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// TEST ROOT
// ===============================
app.get('/', (req, res) => {
    res.json({ message: 'API is running 🚀' });
});

// ===============================
// TEST DATABASE
// ===============================
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================
// ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transactions', transactionRoutes);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
