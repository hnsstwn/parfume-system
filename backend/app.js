const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const reportRoutes = require('./routes/report.routes');

// Middleware
const errorHandler = require('./middleware/error.middleware');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Ganti dengan domain frontend saat production
        methods: ["GET", "POST"]
    }
});

// Middleware Global
app.use(cors());
app.use(express.json());

// Inject IO ke Request agar bisa diakses di controller
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routing
app.get('/', (req, res) => res.send('Parfum API Running...'));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);

// Error Handler (Harus paling bawah)
app.use(errorHandler);

// Socket Connection Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

module.exports = server;

