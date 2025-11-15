const express = require('express');
const bookRoutes = require('./routes/bookRoutes'); // Impor router

const app = express();
const port = 3000;

// --- KUMPULAN MIDDLEWARE ---

// 👇 REVISI DI SINI: Ini yang wajib ada untuk membaca body JSON
app.use(express.json());

// Middleware untuk file statis (Req #6)
app.use(express.static('public'));

// Middleware Logger (Req #3)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); // Lanjut ke middleware/rute berikutnya
});

// --- RUTE UTAMA ---

// Router buku (Req #2)
// Ini harus diletakkan SETELAH app.use(express.json())
app.use('/books', bookRoutes);

// Rute untuk tes error (Req #5)
app.get('/test-error', (req, res, next) => {
    next(new Error('Ini adalah error yang disengaja untuk tes!'));
});

// --- ERROR HANDLING ---

// Error handler (Req #5)
// HARUS di paling bawah
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Terjadi kesalahan internal pada server.',
        error: err.message
    });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server Toko Buku berjalan di http://localhost:${port}`);
});