const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const verifyToken = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(verifyToken);
router.use(authorize('admin'));

router.get('/daily', controller.getDailyReport);
router.get('/best-selling', controller.getBestSelling);
router.get('/dashboard', controller.getDashboardStats);

module.exports = router;

