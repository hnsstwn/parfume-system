const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const db = require('../config/db');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return error(res, 'Access Denied. No token provided.', 401);

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = verified;

        // Cek apakah user masih ada di database
        const userExists = await db.query(
            'SELECT id, role, name FROM users WHERE id = $1',
            [verified.id]
        );

        if (userExists.rows.length === 0) {
            return error(res, 'User no longer exists', 401);
        }

        next();
    } catch (err) {
        return error(res, 'Invalid Token', 403);
    }
};

module.exports = verifyToken;
