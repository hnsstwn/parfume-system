const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

exports.createPurchase = async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { supplier_id, items } = req.body; // items: [{product_id, qty, cost}]
        const user_id = req.user.id;

        if (!items || items.length === 0) return error(res, 'No items provided', 400);

        await client.query('BEGIN');

        let grandTotal = 0;

        // Calculate total
        items.forEach(item => {
            grandTotal += (item.cost * item.qty);
        });

        // 1. Create Purchase Header
        const purchRes = await client.query(
            `INSERT INTO purchases (supplier_id, total) VALUES ($1, $2) RETURNING id`,
            [supplier_id, grandTotal]
        );
        const purchaseId = purchRes.rows[0].id;

        // 2. Process Items & Add Stock
        for (const item of items) {
            // Check product exists
            const prodCheck = await client.query('SELECT name FROM products WHERE id = $1', [item.product_id]);
            if (prodCheck.rows.length === 0) throw new Error(`Product ID ${item.product_id} not found`);

            // Insert Purchase Item
            await client.query(
                `INSERT INTO purchase_items (purchase_id, product_id, qty, cost) VALUES ($1, $2, $3, $4)`,
                [purchaseId, item.product_id, item.qty, item.cost]
            );

            // Add Stock
            await client.query(
                `UPDATE products SET stock = stock + $1 WHERE id = $2`,
                [item.qty, item.product_id]
            );
        }

        // 3. Activity Log
        await client.query(
            `INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)`,
            [user_id, `Added stock via purchase ${purchaseId}`]
        );

        await client.query('COMMIT');

        // Socket Emit
        req.io.emit('stockUpdated', { type: 'purchase', items });

        success(res, { purchase_id: purchaseId, total: grandTotal }, 'Stock added successfully', 201);
    } catch (err) {
        await client.query('ROLLBACK');
        error(res, err.message, 400); // Usually 400 for bad input/ids
    } finally {
        client.release();
    }
};

