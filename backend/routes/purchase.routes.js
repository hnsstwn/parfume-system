const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchase.controller');
const verifyToken = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(verifyToken);
router.use(authorize('admin')); // Hanya admin yg bisa input barang masuk

router.post('/', controller.createPurchase);

module.exports = router;

