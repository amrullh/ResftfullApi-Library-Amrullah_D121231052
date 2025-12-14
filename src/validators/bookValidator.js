const Joi = require('joi');

const createBookSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Judul minimal 3 karakter',
            'string.max': 'Judul maksimal 255 karakter',
            'any.required': 'Judul wajib diisi'
        }),

    author: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Penulis minimal 3 karakter',
            'string.max': 'Penulis maksimal 255 karakter',
            'any.required': 'Penulis wajib diisi'
        }),

    stock: Joi.number()
        .integer()
        .min(0)
        .default(1),

    description: Joi.string()
        .max(1000)
        .optional()
});

const updateBookSchema = Joi.object({
    title: Joi.string()
        .min(3)
        .max(255),

    author: Joi.string()
        .min(3)
        .max(255),

    stock: Joi.number()
        .integer()
        .min(0),

    description: Joi.string()
        .max(1000)
}).min(1); // Minimal 1 field harus diisi untuk update

module.exports = {
    createBookSchema,
    updateBookSchema
};