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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
