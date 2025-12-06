const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

let books = [
    { id: 1, title: 'White night', author: 'Fyodor Doestovsky' },
    { id: 2, title: 'The Crime and Punishment', author: 'Fyodor Doestovsky' }
];
let nextId = 3;

const validateBookData = (req, res, next) => {
    const { title, author } = req.body;
    if (!title || title.trim() === '' || !author || author.trim() === '') {
        return res.status(400).json({
            message: 'Validasi Gagal: Field "title" dan "author" tidak boleh kosong.'
        });
    }
    next();
};

router.get('/', (req, res) => {
    res.status(200).json(books);
});

router.get('/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);

    if (!book) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }
    res.status(200).json(book);
});

router.post('/', authenticateToken, requireAdmin, validateBookData, (req, res) => {
    const { title, author } = req.body;
    const newBook = { id: nextId++, title, author };

    books.push(newBook);
    res.status(201).json(newBook);
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const bookId = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const { title, author } = req.body;
    const updatedBook = {
        ...books[bookIndex],
        title: title || books[bookIndex].title,
        author: author || books[bookIndex].author
    };
    books[bookIndex] = updatedBook;

    res.status(200).json(updatedBook);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const bookId = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    books.splice(bookIndex, 1);
    res.status(204).send();
});

module.exports = router;