const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

// ================= CREATE TRANSACTION =================
router.post("/", verifyToken, async (req, res) => {
  const client = await db.connect();

  try {
    const { product_id, quantity } = req.body;

    // ===== VALIDATION =====
    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity required"
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number"
      });
    }

    await client.query("BEGIN");

    // ===== LOCK PRODUCT ROW (ANTI RACE CONDITION) =====
    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    // ===== CHECK STOCK =====
    if (product.stock < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Insufficient stock"
      });
    }

    const total_price = product.price * quantity;

    // ===== INSERT TRANSACTION =====
    const transactionResult = await client.query(
      `INSERT INTO transactions (user_id, product_id, quantity, total_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, product_id, quantity, total_price]
    );

    // ===== UPDATE STOCK =====
    await client.query(
      "UPDATE products SET stock = stock - $1 WHERE id = $2",
      [quantity, product_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Transaction successful",
      data: transactionResult.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");

    res.status(500).json({
      success: false,
      message: "Transaction failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });

  } finally {
    client.release();
  }
});


// ================= GET USER TRANSACTIONS =================
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, p.name AS product_name
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       WHERE t.user_id = $1
       ORDER BY t.id DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions"
    });
  }
});


// ================= GET ALL TRANSACTIONS (ADMIN ONLY) =================
router.get("/admin/all", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.name AS user_name, p.name AS product_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN products p ON t.product_id = p.id
       ORDER BY t.id DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions"
    });
  }
});

module.exports = router;
