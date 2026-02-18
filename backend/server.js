// LOAD ENV DULU (WAJIB PALING ATAS)
require('dotenv').config();

const express = require('express');
const app = express();

const db = require('./config/db');
const authRoutes = require('./routes/auth.routes');

// Middleware
app.use(express.json());

// ================= ROUTES =================

// Root test
app.get('/', (req, res) => {
    res.json({ message: 'API is running 🚀' });
});

// Test database connection
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

// Auth routes
app.use('/api/auth', authRoutes);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
