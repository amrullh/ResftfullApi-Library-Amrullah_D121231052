const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middlewares/authMiddleware');

let users = [];

router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Username sudah ada!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        username,
        password: hashedPassword,
        role: role || 'user'
    };

    users.push(newUser);
    res.status(201).json({ message: 'Register berhasil!', data: { username, role: newUser.role } });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Username atau Password salah!' });
    }

    const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login sukses', token });
});

module.exports = router;