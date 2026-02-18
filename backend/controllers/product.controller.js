const db = require('../config/db');
const { success, error } = require('../utils/response');

exports.getAllProducts = async (req, res, next) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.name ASC
        `;
        const products = await db.query(query);
        success(res, products.rows);
    } catch (err) {
        next(err);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        const { name, barcode, category_id, price, stock, min_stock } = req.body;
        
        const result = await db.query(
            `INSERT INTO products (name, barcode, category_id, price, stock, min_stock) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, barcode, category_id, price, stock || 0, min_stock || 5]
        );

        req.io.emit('stockUpdated', { type: 'new_product', data: result.rows[0] });
        success(res, result.rows[0], 'Product created', 201);
    } catch (err) {
        next(err);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, barcode, category_id, price, min_stock } = req.body;

        const result = await db.query(
            `UPDATE products SET name=$1, barcode=$2, category_id=$3, price=$4, min_stock=$5 
             WHERE id=$6 RETURNING *`,
            [name, barcode, category_id, price, min_stock, id]
        );

        if (result.rows.length === 0) return error(res, 'Product not found', 404);

        req.io.emit('stockUpdated', { type: 'update_product', data: result.rows[0] });
        success(res, result.rows[0], 'Product updated');
    } catch (err) {
        next(err);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) return error(res, 'Product not found', 404);
        
        req.io.emit('stockUpdated', { type: 'delete_product', id });
        success(res, null, 'Product deleted');
    } catch (err) {
        next(err);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const products = await db.query('SELECT * FROM products WHERE stock <= min_stock');
        success(res, products.rows, 'Low stock products retrieved');
    } catch (err) {
        next(err);
    }
};

