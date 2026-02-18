const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { success, error } = require('../utils/response');

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Validasi
        const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) return error(res, 'Email already registered', 400);

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert User
        const newUser = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'kasir']
        );

        success(res, newUser.rows[0], 'User registered successfully', 201);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return error(res, 'Invalid email or password', 400);

        const validPass = await bcrypt.compare(password, user.rows[0].password);
        if (!validPass) return error(res, 'Invalid email or password', 400);

        // Create Token
        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userData = {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            role: user.rows[0].role,
            token
        };

        success(res, userData, 'Login successful');
    } catch (err) {
        next(err);
    }
};

