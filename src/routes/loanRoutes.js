const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createLoanSchema } = require('../validators/loanValidator');

// Middleware untuk auto-check overdue loans di semua loan routes
const autoCheckLoans = async (req, res, next) => {
    try {
        await loanController.checkAndReturnOverdueLoans();
        next();
    } catch (error) {
        next(error);
    }
};

// Apply auto-check middleware ke semua loan routes
router.use(autoCheckLoans);

// Public routes (tidak ada)

// Protected routes
router.post('/',
    authenticateToken,
    validate(createLoanSchema),
    loanController.createLoan
);

router.get('/',
    authenticateToken,
    loanController.getLoans
);

router.get('/:id',
    authenticateToken,
    loanController.getLoanDetail
);

router.delete('/:id/cancel',
    authenticateToken,
    loanController.cancelLoan
);

// Admin only routes
router.post('/:id/force-return',
    authenticateToken,
    requireAdmin,
    loanController.forceReturnLoan
);

module.exports = router;