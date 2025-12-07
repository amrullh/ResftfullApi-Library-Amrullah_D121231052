const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const SECRET_KEY = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Akses Ditolak: Butuh Token!' });
    }
    try {

        const decoded = jwt.verify(token, SECRET_KEY);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ message: 'User tidak ditemukan' });
        }

        req.user = user;
        next();

    }
    catch (error) {
        return res.status(403).json({ message: 'Token tidak valid' });
    };
}

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Akses Terlarang: Khusus Admin!' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, SECRET_KEY };
