const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

// ===============================
// CREATE TRANSACTION
// ===============================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: "product_id and quantity required"
            });
        }

        // Cek produk
        const product = await db.query(
            'SELECT * FROM products WHERE id = $1',
            [product_id]
        );

        if (product.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const productData = product.rows[0];

        if (productData.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Stock not enough"
            });
        }

        const total_price = productData.price * quantity;

        // Kurangi stok
        await db.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [quantity, product_id]
        );

        // Insert transaksi
        const result = await db.query(
            `INSERT INTO transactions (product_id, quantity, total_price)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [product_id, quantity, total_price]
        );

        res.status(201).json({
            success: true,
            transaction: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
