// Format tanggal ke Indonesia
const formatDateToID = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generate due date (default 7 hari dari sekarang)
const generateDueDate = (days = 7) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
};

// Validasi role
const isValidRole = (role) => {
    const validRoles = ['MEMBER', 'ADMIN'];
    return validRoles.includes(role);
};

// Calculate available stock
const calculateAvailableStock = (stock, activeLoansCount) => {
    return Math.max(0, stock - activeLoansCount);
};

// Mask email untuk keamanan (contoh: user@example.com → us***@example.com)
const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
        ? username.substring(0, 2) + '*'.repeat(username.length - 2)
        : '*'.repeat(username.length);
    return `${maskedUsername}@${domain}`;
};

module.exports = {
    formatDateToID,
    generateDueDate,
    isValidRole,
    calculateAvailableStock,
    maskEmail
};