const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
<<<<<<< HEAD
    res.json({ message: 'Product route working' });
=======
    res.json({ message: "Product route working" });
>>>>>>> 0b1fa52e4a897106d0a7a87a8c484396d95aa7b4
});

module.exports = router;
