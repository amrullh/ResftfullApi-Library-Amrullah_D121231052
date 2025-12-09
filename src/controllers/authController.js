const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const { username, email, password, name } = req.body;

        // Cek duplikat user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username atau email sudah terdaftar',
                field: existingUser.username === username ? 'username' : 'email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name: name || username,
                role: 'MEMBER'
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                name: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: user
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari user
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                email: true,
                password: true,
                role: true,
                name: true,
                refreshToken: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Simpan refresh token ke database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        // Hapus password dari response
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            name: user.name
        };

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken,
                    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m'
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const { id } = req.refreshTokenData;

        // Verifikasi refresh token ada di database
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                role: true,
                refreshToken: true
            }
        });

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                success: false,
                message: 'Refresh token tidak valid'
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        res.json({
            success: true,
            message: 'Token berhasil diperbarui',
            data: {
                accessToken,
                accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m'
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Hapus refresh token dari database
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });

        res.json({
            success: true,
            message: 'Logout berhasil'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            message: 'Data profil berhasil diambil',
            data: user
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe
};