const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Product route working' });
});

module.exports = router;
