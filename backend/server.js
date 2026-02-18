// ===============================
// LOAD ENV (WAJIB PALING ATAS)
// ===============================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// ===============================
// INIT APP
// ===============================
const app = express();

// ===============================
// DATABASE CONNECTION (Railway)
// ===============================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// ===============================
// IMPORT ROUTES
// ===============================
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const reportRoutes = require('./routes/report.routes');
const transactionRoutes = require('./routes/transaction.routes');

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
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ===============================
// SETUP PRODUCTS TABLE
// ===============================
app.get('/setup', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price INTEGER NOT NULL,
                stock INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        res.json({ message: "Products table created ✅" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===============================
// USE ROUTES
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
