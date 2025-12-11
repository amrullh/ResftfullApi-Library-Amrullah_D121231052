const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createBookSchema, updateBookSchema } = require('../validators/bookValidator');
const prisma = require('../config/prisma');

// GET /api/books - List buku dengan PAGINATION, FILTER, SEARCH, SORTING
router.get('/', async (req, res) => {
    try {
        // ========== PARAMETER PAGINATION ==========
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50
        const skip = (page - 1) * limit;

        // ========== PARAMETER FILTER ==========
        const {
            category,
            author,
            minStock,
            maxStock,
            minDate,
            maxDate
        } = req.query;

        // ========== PARAMETER SEARCH ==========
        const search = req.query.search;

        // ========== PARAMETER SORTING ==========
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 'asc' : 'desc';

        // ========== BUILD WHERE CLAUSE ==========
        const where = {};

        // Filter by category ID
        if (category) {
            where.categories = {
                some: {
                    id: parseInt(category)
                }
            };
        }

        // Filter by author (exact match)
        if (author) {
            where.author = author;
        }

        // Filter by stock range
        if (minStock || maxStock) {
            where.stock = {};
            if (minStock) where.stock.gte = parseInt(minStock);
            if (maxStock) where.stock.lte = parseInt(maxStock);
        }

        // Filter by date range
        if (minDate || maxDate) {
            where.createdAt = {};
            if (minDate) where.createdAt.gte = new Date(minDate);
            if (maxDate) where.createdAt.lte = new Date(maxDate);
        }

        // Search by title or author (case-insensitive, partial match)
        if (search) {
            where.OR = [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    author: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        // ========== BUILD ORDER BY ==========
        const orderBy = {};

        // Valid sort fields
        const validSortFields = ['id', 'title', 'author', 'stock', 'createdAt', 'updatedAt'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy] = order;
        } else {
            orderBy.createdAt = 'desc'; // default sort
        }

        // ========== QUERY DATABASE ==========
        const [books, totalBooks] = await Promise.all([
            prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    // Count loans for each book
                    _count: {
                        select: {
                            loans: true
                        }
                    }
                }
            }),
            prisma.book.count({ where })
        ]);

        // Add available stock info (stock - loans count)
        const booksWithAvailability = books.map(book => ({
            ...book,
            availableStock: book.stock - book._count.loans,
            totalLoans: book._count.loans
        }));

        // ========== RESPONSE ==========
        res.status(200).json({
            success: true,
            message: 'Daftar buku berhasil diambil',
            data: booksWithAvailability,
            pagination: {
                page,
                limit,
                total: totalBooks,
                pages: Math.ceil(totalBooks / limit),
                hasNext: page < Math.ceil(totalBooks / limit),
                hasPrev: page > 1
            },
            filters: {
                search: search || null,
                category: category || null,
                author: author || null,
                minStock: minStock || null,
                maxStock: maxStock || null,
                sortBy,
                order
            }
        });

    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// GET /api/books/:id - Detail buku dengan informasi lengkap
router.get('/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id);

        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                loans: {
                    where: {
                        returnDate: null, // Hanya pinjaman yang aktif
                        status: 'BORROWED'
                    },
                    select: {
                        id: true,
                        borrowDate: true,
                        dueDate: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        loans: true
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

        // Calculate available stock
        const availableStock = book.stock - book._count.loans;

        const bookResponse = {
            ...book,
            availableStock,
            totalLoans: book._count.loans
        };

        res.status(200).json({
            success: true,
            message: 'Detail buku berhasil diambil',
            data: bookResponse
        });
    } catch (error) {
        console.error('Error fetching book detail:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// POST /api/books - Tambah buku (Admin only)
router.post('/',
    authenticateToken,
    requireAdmin,
    validate(createBookSchema),
    async (req, res) => {
        try {
            const { title, author, stock, description, categoryIds } = req.body;

            // Validasi categoryIds jika ada
            if (categoryIds && categoryIds.length > 0) {
                // Cek apakah semua category ID valid
                const categories = await prisma.category.findMany({
                    where: {
                        id: {
                            in: categoryIds.map(id => parseInt(id))
                        }
                    }
                });

                if (categories.length !== categoryIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'Beberapa kategori tidak ditemukan'
                    });
                }
            }

            const newBook = await prisma.book.create({
                data: {
                    title,
                    author,
                    stock: stock || 1,
                    description: description || null,
                    categories: categoryIds && categoryIds.length > 0
                        ? {
                            connect: categoryIds.map(id => ({ id: parseInt(id) }))
                        }
                        : undefined
                },
                include: {
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Buku berhasil ditambahkan',
                data: newBook
            });
        } catch (error) {
            console.error('Error creating book:', error);

            // Handle Prisma unique constraint errors
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Buku dengan judul tersebut mungkin sudah ada'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    });

// PUT /api/books/:id - Update buku (Admin only)
router.put('/:id',
    authenticateToken,
    requireAdmin,
    validate(updateBookSchema),
    async (req, res) => {
        try {
            const bookId = parseInt(req.params.id);
            const { title, author, stock, description, categoryIds } = req.body;

            // Cek apakah buku ada
            const existingBook = await prisma.book.findUnique({
                where: { id: bookId }
            });

            if (!existingBook) {
                return res.status(404).json({
                    success: false,
                    message: 'Buku tidak ditemukan'
                });
            }

            // Validasi categoryIds jika ada
            if (categoryIds !== undefined) {
                if (categoryIds.length > 0) {
                    // Cek apakah semua category ID valid
                    const categories = await prisma.category.findMany({
                        where: {
                            id: {
                                in: categoryIds.map(id => parseInt(id))
                            }
                        }
                    });

                    if (categories.length !== categoryIds.length) {
                        return res.status(400).json({
                            success: false,
                            message: 'Beberapa kategori tidak ditemukan'
                        });
                    }
                }
            }

            // Siapkan data update
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (author !== undefined) updateData.author = author;
            if (stock !== undefined) updateData.stock = stock;
            if (description !== undefined) updateData.description = description;

            // Jika ada categoryIds, update relasi
            if (categoryIds !== undefined) {
                updateData.categories = {
                    set: categoryIds.map(id => ({ id: parseInt(id) }))
                };
            }

            const updatedBook = await prisma.book.update({
                where: { id: bookId },
                data: updateData,
                include: {
                    categories: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            res.status(200).json({
                success: true,
                message: 'Buku berhasil diperbarui',
                data: updatedBook
            });
        } catch (error) {
            console.error('Error updating book:', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'Buku dengan judul tersebut mungkin sudah ada'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    });

// DELETE /api/books/:id - Hapus buku (Admin only)
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const bookId = parseInt(req.params.id);

            // Cek apakah buku ada
            const existingBook = await prisma.book.findUnique({
                where: { id: bookId },
                include: {
                    _count: {
                        select: {
                            loans: true
                        }
                    }
                }
            });

            if (!existingBook) {
                return res.status(404).json({
                    success: false,
                    message: 'Buku tidak ditemukan'
                });
            }

            // Cek apakah buku sedang dipinjam
            if (existingBook._count.loans > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Buku tidak dapat dihapus karena masih dipinjam'
                });
            }

            // Hapus buku
            await prisma.book.delete({
                where: { id: bookId }
            });

            res.status(200).json({
                success: true,
                message: 'Buku berhasil dihapus'
            });
        } catch (error) {
            console.error('Error deleting book:', error);

            // Handle foreign key constraint errors
            if (error.code === 'P2003') {
                return res.status(400).json({
                    success: false,
                    message: 'Buku tidak dapat dihapus karena masih terhubung dengan data lain'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    });

// GET /api/books/:id/categories - Get categories for a book
router.get('/:id/categories', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id);

        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                categories: true
            }
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Kategori buku berhasil diambil',
            data: book.categories
        });
    } catch (error) {
        console.error('Error fetching book categories:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// POST /api/books/:id/categories - Add categories to book (Admin only)
router.post('/:id/categories',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const bookId = parseInt(req.params.id);
            const { categoryIds } = req.body;

            if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'categoryIds (array) diperlukan'
                });
            }

            // Cek apakah buku ada
            const book = await prisma.book.findUnique({
                where: { id: bookId }
            });

            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Buku tidak ditemukan'
                });
            }

            // Tambahkan kategori
            const updatedBook = await prisma.book.update({
                where: { id: bookId },
                data: {
                    categories: {
                        connect: categoryIds.map(id => ({ id: parseInt(id) }))
                    }
                },
                include: {
                    categories: true
                }
            });

            res.status(200).json({
                success: true,
                message: 'Kategori berhasil ditambahkan ke buku',
                data: updatedBook.categories
            });
        } catch (error) {
            console.error('Error adding categories to book:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    });

module.exports = router;