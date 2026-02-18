const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/auth.controller');
// Register biasanya diprotect atau untuk setup awal, disini saya buka untuk contoh
router.post('/register', register); 
router.post('/login', login);

module.exports = router;

