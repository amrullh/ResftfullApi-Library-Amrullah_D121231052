const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, verifyRefreshToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
    registerSchema,
    loginSchema,
    refreshTokenSchema
} = require('../validators/authValidator');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), verifyRefreshToken, authController.refreshToken);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;