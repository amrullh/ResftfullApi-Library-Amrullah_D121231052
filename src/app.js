const express = require('express');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);

app.get('/test-error', (req, res, next) => {
    next(new Error('Ini adalah error yang disengaja untuk tes!'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Terjadi kesalahan internal pada server.',
        error: err.message
    });
});


app.listen(port, () => {
    console.log(`Server Toko Buku berjalan di http://localhost:${port}`);
});