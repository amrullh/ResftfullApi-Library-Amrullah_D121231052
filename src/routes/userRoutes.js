const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { updateUserSchema } = require('../validators/userValidator');

// Admin only routes
router.get('/',
    authenticateToken,
    requireAdmin,
    userController.getUsers
);

// Protected routes (owner atau admin)
router.get('/:id',
    authenticateToken,
    userController.getUserDetail
);

router.put('/:id',
    authenticateToken,
    validate(updateUserSchema),
    userController.updateUser
);

// Admin only: update role
router.patch('/:id/role',
    authenticateToken,
    requireAdmin,
    userController.updateUserRole
);

module.exports = router;