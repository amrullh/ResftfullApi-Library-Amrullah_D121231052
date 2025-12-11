const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createBookSchema, updateBookSchema } = require('../validators/bookValidator');
const prisma = require('../config/prisma');

// GET /api/books - List buku (dengan pagination sederhana, tanpa filter)
router.get('/', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Query database dengan Prisma
        const books = await prisma.book.findMany({
            skip,
            take: limit,
            include: {
                categories: true
            }
        });

        // Total buku untuk pagination info
        const totalBooks = await prisma.book.count();

        res.status(200).json({
            success: true,
            message: 'Daftar buku berhasil diambil',
            data: books,
            pagination: {
                page,
                limit,
                total: totalBooks,
                pages: Math.ceil(totalBooks / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// GET /api/books/:id - Detail buku
router.get('/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id);

        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                categories: true,
                loans: true // Jika ingin melihat data peminjaman
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
            message: 'Detail buku berhasil diambil',
            data: book
        });
    } catch (error) {
        console.error(error);
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
            const { title, author, stock, description, categories } = req.body;

            // Jika ada kategori, kita akan menghubungkannya
            // categories diharapkan array of category ids
            const categoryConnect = categories && categories.length > 0
                ? {
                    connect: categories.map(catId => ({ id: catId }))
                }
                : undefined;

            const newBook = await prisma.book.create({
                data: {
                    title,
                    author,
                    stock: stock || 1,
                    description,
                    categories: categoryConnect
                },
                include: {
                    categories: true
                }
            });

            res.status(201).json({
                success: true,
                message: 'Buku berhasil ditambahkan',
                data: newBook
            });
        } catch (error) {
            console.error(error);
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
            const { title, author, stock, description, categories } = req.body;

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

            // Siapkan data update
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (author !== undefined) updateData.author = author;
            if (stock !== undefined) updateData.stock = stock;
            if (description !== undefined) updateData.description = description;

            // Jika ada kategori, update relasi
            if (categories !== undefined) {

                await prisma.book.update({
                    where: { id: bookId },
                    data: {
                        categories: {
                            set: [] // Hapus semua relasi
                        }
                    }
                });

                // Jika categories array tidak kosong, connect kembali
                if (categories.length > 0) {
                    updateData.categories = {
                        connect: categories.map(catId => ({ id: catId }))
                    };
                }
            }

            const updatedBook = await prisma.book.update({
                where: { id: bookId },
                data: updateData,
                include: {
                    categories: true
                }
            });

            res.status(200).json({
                success: true,
                message: 'Buku berhasil diperbarui',
                data: updatedBook
            });
        } catch (error) {
            console.error(error);
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
                where: { id: bookId }
            });

            if (!existingBook) {
                return res.status(404).json({
                    success: false,
                    message: 'Buku tidak ditemukan'
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
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    });

module.exports = router;