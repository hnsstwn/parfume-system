const db = require('../config/db');
const { success } = require('../utils/response');

exports.getDailyReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                DATE(created_at) as date, 
                COUNT(id) as total_transactions, 
                SUM(total) as revenue 
            FROM transactions 
            GROUP BY DATE(created_at) 
            ORDER BY date DESC 
            LIMIT 30
        `;
        const result = await db.query(query);
        success(res, result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getBestSelling = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                p.name, 
                SUM(ti.qty) as total_sold,
                SUM(ti.qty * ti.price) as revenue_generated
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT 10
        `;
        const result = await db.query(query);
        success(res, result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        // Simple aggregate for dashboard cards
        const salesToday = await db.query("SELECT SUM(total) as total FROM transactions WHERE DATE(created_at) = CURRENT_DATE");
        const transCount = await db.query("SELECT COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURRENT_DATE");
        const lowStock = await db.query("SELECT COUNT(*) as count FROM products WHERE stock <= min_stock");

        success(res, {
            sales_today: salesToday.rows[0].total || 0,
            transactions_today: transCount.rows[0].count,
            low_stock_count: lowStock.rows[0].count
        });
    } catch (err) {
        next(err);
    }
};

