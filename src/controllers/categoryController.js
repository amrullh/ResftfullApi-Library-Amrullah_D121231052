const prisma = require('../config/prisma');

// GET /api/categories - List kategori (public)
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            success: true,
            message: 'Daftar kategori berhasil diambil',
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// POST /api/categories - Buat kategori (admin only)
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const category = await prisma.category.create({
            data: { name }
        });

        res.status(201).json({
            success: true,
            message: 'Kategori berhasil dibuat',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Kategori dengan nama tersebut sudah ada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// PUT /api/categories/:id - Update kategori (admin only)
const updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name } = req.body;

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name }
        });

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil diperbarui',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Kategori dengan nama tersebut sudah ada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// DELETE /api/categories/:id - Hapus kategori (admin only)
const deleteCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        await prisma.category.delete({
            where: { id: categoryId }
        });

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting category:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        // Jika masih ada buku yang menggunakan kategori ini
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat menghapus kategori karena masih digunakan oleh beberapa buku'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};