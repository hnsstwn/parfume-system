const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// ================= TOTAL SUMMARY =================
router.get('/summary', verifyToken, checkRole('admin'), async (req, res) => {
    try {

        const revenueResult = await db.query(
            'SELECT COALESCE(SUM(total_price),0) AS total_revenue FROM transactions'
        );

        const transactionResult = await db.query(
            'SELECT COUNT(*) AS total_transactions FROM transactions'
        );

        res.json({
            success: true,
            total_revenue: revenueResult.rows[0].total_revenue,
            total_transactions: transactionResult.rows[0].total_transactions
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= TOP SELLING PRODUCTS =================
router.get('/top-products', verifyToken, checkRole('admin'), async (req, res) => {
    try {

        const result = await db.query(`
            SELECT p.name,
                   SUM(t.quantity) AS total_sold
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= REPORT BY DATE =================
router.get('/by-date', verifyToken, checkRole('admin'), async (req, res) => {
    try {

        const { start, end } = req.query;

        const result = await db.query(
            `SELECT *
             FROM transactions
             WHERE created_at BETWEEN $1 AND $2
             ORDER BY created_at DESC`,
            [start, end]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
