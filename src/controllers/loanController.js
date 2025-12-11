const prisma = require('../config/prisma');

// Middleware untuk auto-check loans yang sudah due
const checkAndReturnOverdueLoans = async () => {
    try {
        const now = new Date();

        // Cari loans yang sudah due dan masih status BORROWED
        const overdueLoans = await prisma.loan.findMany({
            where: {
                dueDate: {
                    lt: now
                },
                status: 'BORROWED'
            },
            include: {
                book: true
            }
        });

        // Update status dan kembalikan stok
        for (const loan of overdueLoans) {
            // Kembalikan stok buku
            await prisma.book.update({
                where: { id: loan.bookId },
                data: {
                    stock: {
                        increment: 1
                    }
                }
            });

            // Update status loan jadi RETURNED
            await prisma.loan.update({
                where: { id: loan.id },
                data: {
                    status: 'RETURNED',
                    returnDate: now
                }
            });

            console.log(`Buku "${loan.book.title}" (ID: ${loan.bookId}) otomatis dikembalikan`);
        }

        return overdueLoans.length;
    } catch (error) {
        console.error('Error checking overdue loans:', error);
        return 0;
    }
};

// Buat loan baru (pinjam buku)
const createLoan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId, dueDays } = req.body;

        // Auto-check loans yang sudah due
        await checkAndReturnOverdueLoans();

        // Cek apakah buku ada dan stok tersedia
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                _count: {
                    select: {
                        loans: {
                            where: {
                                status: 'BORROWED'
                            }
                        }
                    }
                }
            }
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        // Hitung stok yang tersedia
        const availableStock = book.stock - book._count.loans;

        if (availableStock <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Buku sedang tidak tersedia untuk dipinjam'
            });
        }

        // Cek apakah user sudah meminjam buku ini dan belum dikembalikan
        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId,
                bookId,
                status: 'BORROWED'
            }
        });

        if (existingLoan) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah meminjam buku ini dan belum mengembalikannya'
            });
        }

        // Hitung due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (dueDays || 7));

        // Buat loan dan kurangi stok
        const loan = await prisma.$transaction(async (tx) => {
            // Kurangi stok buku
            await tx.book.update({
                where: { id: bookId },
                data: {
                    stock: {
                        decrement: 1
                    }
                }
            });

            // Buat loan record
            return await tx.loan.create({
                data: {
                    userId,
                    bookId,
                    dueDate,
                    status: 'BORROWED'
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true
                        }
                    }
                }
            });
        });

        res.status(201).json({
            success: true,
            message: 'Buku berhasil dipinjam',
            data: {
                ...loan,
                dueDate: loan.dueDate.toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// Get all loans (admin lihat semua, user lihat milik sendiri)
const getLoans = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Auto-check loans yang sudah due
        await checkAndReturnOverdueLoans();

        // Query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const skip = (page - 1) * limit;

        const status = req.query.status; // BORROWED, RETURNED
        const bookId = req.query.bookId ? parseInt(req.query.bookId) : undefined;

        // Build where clause
        const where = {};

        // User biasa hanya bisa lihat loans sendiri
        if (userRole !== 'ADMIN') {
            where.userId = userId;
        }

        if (status) {
            where.status = status;
        }

        if (bookId) {
            where.bookId = bookId;
        }

        // Get loans
        const [loans, totalLoans] = await Promise.all([
            prisma.loan.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.loan.count({ where })
        ]);

        // Format response
        const formattedLoans = loans.map(loan => ({
            ...loan,
            dueDate: loan.dueDate.toISOString(),
            borrowDate: loan.borrowDate.toISOString(),
            returnDate: loan.returnDate ? loan.returnDate.toISOString() : null,
            isOverdue: loan.status === 'BORROWED' && new Date(loan.dueDate) < new Date()
        }));

        res.status(200).json({
            success: true,
            message: 'Daftar peminjaman berhasil diambil',
            data: formattedLoans,
            pagination: {
                page,
                limit,
                total: totalLoans,
                pages: Math.ceil(totalLoans / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// Get loan detail
const getLoanDetail = async (req, res) => {
    try {
        const loanId = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;

        // Auto-check loans yang sudah due
        await checkAndReturnOverdueLoans();

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        description: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Data peminjaman tidak ditemukan'
            });
        }

        // Cek authorization: user hanya bisa lihat loan sendiri
        if (userRole !== 'ADMIN' && loan.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses ke data ini'
            });
        }

        const formattedLoan = {
            ...loan,
            dueDate: loan.dueDate.toISOString(),
            borrowDate: loan.borrowDate.toISOString(),
            returnDate: loan.returnDate ? loan.returnDate.toISOString() : null,
            isOverdue: loan.status === 'BORROWED' && new Date(loan.dueDate) < new Date()
        };

        res.status(200).json({
            success: true,
            message: 'Detail peminjaman berhasil diambil',
            data: formattedLoan
        });

    } catch (error) {
        console.error('Error fetching loan detail:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// Cancel loan (hanya jika belum due)
const cancelLoan = async (req, res) => {
    try {
        const loanId = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;

        // Cari loan
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                book: true
            }
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Data peminjaman tidak ditemukan'
            });
        }

        // Cek authorization
        if (userRole !== 'ADMIN' && loan.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk membatalkan peminjaman ini'
            });
        }

        // Cek status
        if (loan.status !== 'BORROWED') {
            return res.status(400).json({
                success: false,
                message: 'Peminjaman ini sudah dikembalikan atau dibatalkan'
            });
        }

        // Cek due date (tidak bisa cancel jika sudah due)
        if (new Date(loan.dueDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat membatalkan peminjaman yang sudah lewat due date'
            });
        }

        // Cancel loan dan kembalikan stok
        await prisma.$transaction(async (tx) => {
            // Kembalikan stok buku
            await tx.book.update({
                where: { id: loan.bookId },
                data: {
                    stock: {
                        increment: 1
                    }
                }
            });

            // Update loan status
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'CANCELLED',
                    returnDate: new Date()
                }
            });
        });

        res.status(200).json({
            success: true,
            message: 'Peminjaman berhasil dibatalkan'
        });

    } catch (error) {
        console.error('Error cancelling loan:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// Admin bisa force return loan
const forceReturnLoan = async (req, res) => {
    try {
        const loanId = parseInt(req.params.id);

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                book: true
            }
        });

        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Data peminjaman tidak ditemukan'
            });
        }

        if (loan.status !== 'BORROWED') {
            return res.status(400).json({
                success: false,
                message: 'Peminjaman ini sudah dikembalikan atau dibatalkan'
            });
        }

        // Kembalikan stok dan update loan
        await prisma.$transaction(async (tx) => {
            await tx.book.update({
                where: { id: loan.bookId },
                data: {
                    stock: {
                        increment: 1
                    }
                }
            });

            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'RETURNED',
                    returnDate: new Date()
                }
            });
        });

        res.status(200).json({
            success: true,
            message: 'Buku berhasil dikembalikan secara paksa'
        });

    } catch (error) {
        console.error('Error force returning loan:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    createLoan,
    getLoans,
    getLoanDetail,
    cancelLoan,
    forceReturnLoan,
    checkAndReturnOverdueLoans
};