const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator');

// Public routes
router.get('/', categoryController.getCategories);

// Admin only routes
router.post('/',
    authenticateToken,
    requireAdmin,
    validate(createCategorySchema),
    categoryController.createCategory
);

router.put('/:id',
    authenticateToken,
    requireAdmin,
    validate(updateCategorySchema),
    categoryController.updateCategory
);

router.delete('/:id',
    authenticateToken,
    requireAdmin,
    categoryController.deleteCategory
);

module.exports = router;