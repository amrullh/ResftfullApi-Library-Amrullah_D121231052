const Joi = require('joi');

const updateUserSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Nama minimal 2 karakter',
            'string.max': 'Nama maksimal 100 karakter'
        }),

    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Format email tidak valid'
        }),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .messages({
            'string.min': 'Password minimal 8 karakter',
            'string.pattern.base': 'Password harus mengandung minimal: 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol'
        })
}).min(1); // Minimal 1 field harus diisi

module.exports = {
    updateUserSchema
};