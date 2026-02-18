// LOAD ENV DULU (WAJIB PALING ATAS)
require('dotenv').config();

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
    res.json({ message: 'API is running 🚀' });
});
const db = require('./config/db');

app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
