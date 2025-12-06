// src/app.js
const express = require('express');
const app = express();

require('dotenv').config();
const port = process.env.PORT || 3000;

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.get('/', (req, res) => {
    res.send('Selamat datang di API Perpustakaan! Akses endpoint di /api/...');
});

app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Terjadi kesalahan internal pada server.',
        error: err.message
    });
});


if (require.main === module) {
    app.listen(port, () => {
        console.log(`✅ Server berjalan di http://localhost:${port}`);
    });
}

module.exports = app;