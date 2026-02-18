const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

// ===============================
// GET ALL PRODUCTS
// ===============================
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// GET PRODUCT BY ID
// ===============================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM products WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// CREATE PRODUCT
// ===============================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        if (!name || !price || !stock) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        const result = await db.query(
            `INSERT INTO products (name, price, stock)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, price, stock]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// UPDATE PRODUCT
// ===============================
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        const result = await db.query(
            `UPDATE products
             SET name = $1, price = $2, stock = $3
             WHERE id = $4
             RETURNING *`,
            [name, price, stock, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// DELETE PRODUCT
// ===============================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM products WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
