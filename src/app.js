require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');

// ========== SECURITY MIDDLEWARE ==========

// 1. Helmet.js - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// 2. Rate limiting - Cegah brute force attack
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan, coba lagi setelah 15 menit'
    },
    skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Terlalu banyak request dari IP Anda'
    }
});

// ========== BASIC MIDDLEWARE ==========

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== CORS ==========

app.use((req, res, next) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? ['https://perpustakaan.com']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// ========== LOGGER MIDDLEWARE ==========

app.use((req, res, next) => {
    const start = Date.now();

    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***HIDDEN***';
    if (logBody.refreshToken) logBody.refreshToken = '***HIDDEN***';
    if (logBody.token) logBody.token = '***HIDDEN***';

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if (Object.keys(logBody).length > 0) {
        console.log('Body:', logBody);
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// ========== ROUTES DENGAN RATE LIMITING ==========

// Health check - tanpa rate limit
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Root endpoint - tanpa rate limit
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Selamat datang di API Perpustakaan',
        endpoints: {
            auth: '/api/auth',
            books: '/api/books',
            categories: '/api/categories',
            loans: '/api/loans',
            users: '/api/users',
            health: '/health'
        },
        security: {
            rateLimiting: 'Aktif',
            helmet: 'Aktif',
            cors: 'Aktif'
        },
        documentation: 'Lihat API-DOCS.md untuk dokumentasi lengkap'
    });
});

// Auth routes dengan rate limiting ketat
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh-token', authLimiter);

// API routes dengan rate limiting normal
app.use('/api', apiLimiter);

// Semua routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);

// ========== ERROR HANDLING ==========

// 404 handler (PERBAIKAN: tanpa '*' pattern)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan',
        requestedUrl: req.originalUrl,
        availableEndpoints: {
            auth: '/api/auth',
            books: '/api/books',
            categories: '/api/categories',
            loans: '/api/loans',
            users: '/api/users',
            health: '/health'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token tidak valid'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token telah kedaluwarsa'
        });
    }

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'Data sudah ada (duplicate entry)'
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Data tidak ditemukan'
        });
    }

    // Rate limit error
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Terlalu banyak request'
        });
    }

    // Default error
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Terjadi kesalahan internal pada server.'
        : err.message;

    const errorResponse = {
        success: false,
        message
    };

    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
});

//  SERVER STARTUP 

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`

       API Perpustakaan Berjalan       

        
Server    : http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
        
AUTH ENDPOINTS:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh-token
  POST   /api/auth/logout
  GET    /api/auth/me
        
RESOURCE ENDPOINTS:
  GET    /api/books           - Daftar buku
  GET    /api/categories      - Daftar kategori
  GET    /api/loans           - Daftar peminjaman
        
SECURITY FEATURES:
  ✓ Helmet.js headers
  ✓ Rate limiting
  ✓ CORS protection
  ✓ Request logging
        
Health check: http://localhost:${PORT}/health

        `);
    });
}

module.exports = app;