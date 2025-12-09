const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'Username hanya boleh berisi huruf dan angka',
            'string.min': 'Username minimal 3 karakter',
            'string.max': 'Username maksimal 30 karakter',
            'any.required': 'Username wajib diisi'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Format email tidak valid',
            'any.required': 'Email wajib diisi'
        }),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .required()
        .messages({
            'string.min': 'Password minimal 8 karakter',
            'string.pattern.base': 'Password harus mengandung minimal: 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol',
            'any.required': 'Password wajib diisi'
        }),

    name: Joi.string()
        .min(2)
        .max(100)
        .optional()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema
};