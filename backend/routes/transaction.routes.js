const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

// ================= CREATE TRANSACTION =================
router.post('/', verifyToken, async (req, res) => {
    const client = await db.connect();

    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'product_id and quantity required'
            });
        }

        await client.query('BEGIN');

        // 1️⃣ Cek produk
        const productResult = await client.query(
            'SELECT * FROM products WHERE id = $1 FOR UPDATE',
            [product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = productResult.rows[0];

        // 2️⃣ Cek stok cukup
        if (product.stock < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Stock not enough'
            });
        }

        const totalPrice = product.price * quantity;

        // 3️⃣ Insert transaksi
        const transactionResult = await client.query(
            `INSERT INTO transactions (product_id, quantity, total_price)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [product_id, quantity, totalPrice]
        );

        // 4️⃣ Kurangi stok
        await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [quantity, product_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            transaction: transactionResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
