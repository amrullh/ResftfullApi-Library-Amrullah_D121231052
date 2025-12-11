const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// GET /api/users - List users (admin only)
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        loans: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Tambah info total loans
        const usersWithLoanCount = users.map(user => ({
            ...user,
            totalLoans: user._count.loans
        }));

        res.status(200).json({
            success: true,
            message: 'Daftar user berhasil diambil',
            data: usersWithLoanCount
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// GET /api/users/:id - Detail user
const getUserDetail = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;

        // Authorization check: user hanya bisa lihat data sendiri, admin bisa lihat semua
        if (requestingUserRole !== 'ADMIN' && userId !== requestingUserId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses ke data user ini'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                loans: {
                    select: {
                        id: true,
                        borrowDate: true,
                        dueDate: true,
                        status: true,
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true
                            }
                        }
                    },
                    orderBy: {
                        borrowDate: 'desc'
                    },
                    take: 5 // Limit 5 pinjaman terakhir
                },
                _count: {
                    select: {
                        loans: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        const userResponse = {
            ...user,
            totalLoans: user._count.loans
        };

        res.status(200).json({
            success: true,
            message: 'Detail user berhasil diambil',
            data: userResponse
        });
    } catch (error) {
        console.error('Error fetching user detail:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// PUT /api/users/:id - Update user profile
const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;
        const { name, email, password } = req.body;

        // Authorization check: user hanya bisa update data sendiri, admin bisa update semua
        if (requestingUserRole !== 'ADMIN' && userId !== requestingUserId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk mengupdate user ini'
            });
        }

        // Cek apakah user ada
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;

        if (email !== undefined && email !== existingUser.email) {
            // Cek apakah email sudah digunakan
            const emailExists = await prisma.user.findUnique({
                where: { email }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email sudah digunakan oleh user lain'
                });
            }
            updateData.email = email;
        }

        if (password !== undefined) {
            // Hash password baru
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profil user berhasil diperbarui',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Email sudah digunakan'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

// Admin: Update user role
const updateUserRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        // Validasi role
        const validRoles = ['MEMBER', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role hanya boleh MEMBER atau ADMIN'
            });
        }

        // Cek apakah user ada
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Update role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Role user berhasil diperbarui',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    getUsers,
    getUserDetail,
    updateUser,
    updateUserRole
};