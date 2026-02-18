const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

// ================= CREATE PRODUCT =================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        if (!name || !price || !stock) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newProduct = await db.query(
            `INSERT INTO products (name, price, stock)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, price, stock]
        );

        res.status(201).json(newProduct.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= GET ALL PRODUCTS =================
router.get('/', verifyToken, async (req, res) => {
    try {
        const products = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(products.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= UPDATE PRODUCT =================
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock } = req.body;

        const updatedProduct = await db.query(
            `UPDATE products
             SET name=$1, price=$2, stock=$3
             WHERE id=$4
             RETURNING *`,
            [name, price, stock, id]
        );

        res.json(updatedProduct.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= DELETE PRODUCT =================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM products WHERE id=$1', [id]);

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
