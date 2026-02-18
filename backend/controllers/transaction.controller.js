const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

exports.createTransaction = async (req, res, next) => {
    const client = await pool.connect();
    
    try {
        const { items, payment_method } = req.body; // items: [{product_id, qty}]
        const user_id = req.user.id;
        
        if (!items || items.length === 0) return error(res, 'Cart is empty', 400);

        // 1. BEGIN Transaction
        await client.query('BEGIN');

        let grandTotal = 0;
        const processedItems = [];

        // 2. Validate Stock & Calculate Total
        for (const item of items) {
            const productRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
            
            if (productRes.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
            
            const product = productRes.rows[0];
            
            if (product.stock < item.qty) {
                throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
            }

            const lineTotal = product.price * item.qty;
            grandTotal += lineTotal;
            
            processedItems.push({
                product_id: product.id,
                price: product.price,
                qty: item.qty,
                name: product.name
            });
        }

        // 3. Create Transaction Header
        const transRes = await client.query(
            `INSERT INTO transactions (user_id, total, payment_method) VALUES ($1, $2, $3) RETURNING id`,
            [user_id, grandTotal, payment_method]
        );
        const transactionId = transRes.rows[0].id;

        // 4. Create Transaction Items & Deduct Stock
        for (const item of processedItems) {
            // Insert item
            await client.query(
                `INSERT INTO transaction_items (transaction_id, product_id, qty, price) VALUES ($1, $2, $3, $4)`,
                [transactionId, item.product_id, item.qty, item.price]
            );

            // Deduct Stock
            await client.query(
                `UPDATE products SET stock = stock - $1 WHERE id = $2`,
                [item.qty, item.product_id]
            );
        }

        // 5. Activity Log
        await client.query(
            `INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)`,
            [user_id, `Created transaction ${transactionId} with total ${grandTotal}`]
        );

        // 6. COMMIT
        await client.query('COMMIT');

        // 7. Socket Emit (Notify Dashboard)
        req.io.emit('stockUpdated', { type: 'transaction', items: processedItems });

        success(res, { transaction_id: transactionId, total: grandTotal }, 'Transaction successful', 201);

    } catch (err) {
        await client.query('ROLLBACK');
        // Custom error message logic
        const statusCode = err.message.includes('Insufficient stock') ? 400 : 500;
        error(res, err.message, statusCode);
    } finally {
        client.release();
    }
};

exports.getTransactions = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT t.id, t.total, t.payment_method, t.created_at, u.name as cashier_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 50
        `);
        success(res, result.rows);
    } catch (err) {
        next(err);
    }
};

