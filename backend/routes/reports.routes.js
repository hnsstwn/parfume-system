const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// ================= SUMMARY REPORT (ADMIN ONLY) =================
router.get('/summary', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const totalRevenue = await db.query(
            'SELECT COALESCE(SUM(total_price),0) AS total_revenue FROM transactions'
        );

        const totalTransactions = await db.query(
            'SELECT COUNT(*) AS total_transactions FROM transactions'
        );

        res.json({
            success: true,
            total_revenue: totalRevenue.rows[0].total_revenue,
            total_transactions: totalTransactions.rows[0].total_transactions
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
