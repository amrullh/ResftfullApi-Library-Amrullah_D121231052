const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Akses ditolak: Token tidak ditemukan'
            });
        }

        // Verifikasi access token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Cek user di database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                name: true,
                refreshToken: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Attach user ke request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token telah kedaluwarsa',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Token tidak valid',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Kesalahan server'
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak: Hanya admin yang diizinkan'
        });
    }
    next();
};

// Middleware untuk refresh token (tidak require user di database)
const verifyRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token diperlukan'
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        req.refreshTokenData = decoded;
        req.refreshToken = refreshToken;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token telah kedaluwarsa'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Refresh token tidak valid'
        });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    verifyRefreshToken
};