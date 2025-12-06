// src/controllers/authController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { username, email, password, name } = req.body;

    try {
        // 1. Cek apakah user/email sudah ada
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username atau Email sudah terdaftar' });
        }
        // 2. Hash Password (Keamanan)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Simpan ke Database
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name: name || username,
                role: 'MEMBER'
            }
        });

        res.status(201).json({
            message: 'Registrasi berhasil',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // 1. Cari User di Database
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Username atau Password salah' });
        }
        // 2. Cek Kesesuaian Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau Password salah' });
        }
        // 3. Buat Token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'rahasia-super',
            { expiresIn: '1h' }
        );
        res.json({
            message: 'Login sukses',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};
module.exports = { register, login };