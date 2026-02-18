const express = require('express');
const router = express.Router();
const controller = require('../controllers/transaction.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', controller.createTransaction);
router.get('/', controller.getTransactions);

module.exports = router;

