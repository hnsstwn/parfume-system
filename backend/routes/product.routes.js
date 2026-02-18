const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');


// ================= GET ALL PRODUCTS (WITH PAGINATION + SEARCH) =================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT * FROM products
       WHERE LOWER(name) LIKE LOWER($1)
       ORDER BY id DESC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );

    const total = await db.query(
      `SELECT COUNT(*) FROM products
       WHERE LOWER(name) LIKE LOWER($1)`,
      [`%${search}%`]
    );

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total: Number(total.rows[0].count),
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message
    });
  }
});


// ================= GET PRODUCT BY ID =================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message
    });
  }
});


// ================= CREATE PRODUCT (ADMIN ONLY) =================
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { name, price, stock } = req.body;

    if (!name || price == null || stock == null) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    if (isNaN(price) || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock must be numbers'
      });
    }

    const result = await db.query(
      `INSERT INTO products (name, price, stock)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, price, stock]
    );

    res.status(201).json({
      success: true,
      message: "Product created",
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message
    });
  }
});


// ================= UPDATE PRODUCT (ADMIN ONLY) =================
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { name, price, stock } = req.body;

    if (isNaN(price) || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock must be numbers'
      });
    }

    const result = await db.query(
      `UPDATE products
       SET name = $1, price = $2, stock = $3
       WHERE id = $4
       RETURNING *`,
      [name, price, stock, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: "Product updated",
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message
    });
  }
});


// ================= DELETE PRODUCT (ADMIN ONLY) =================
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message
    });
  }
});


module.exports = router;
