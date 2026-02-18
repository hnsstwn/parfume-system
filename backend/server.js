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
// DATABASE CONNECTION
// ===============================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// TEST API ROOT
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
// CREATE PRODUCTS TABLE (SETUP)
// ===============================
app.get('/create-products-table', async (req, res) => {
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

        res.json({ success: true, message: "Products table created ✅" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
