const jwt = require('jsonwebtoken');
const SECRET_KEY = 'rahasia-dong';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Akses Ditolak: Butuh Token!' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token Tidak Valid!' });
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses Terlarang: Khusus Admin!' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, SECRET_KEY };