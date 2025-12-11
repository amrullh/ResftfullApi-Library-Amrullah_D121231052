const Joi = require('joi');

const createCategorySchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Nama kategori minimal 2 karakter',
            'string.max': 'Nama kategori maksimal 50 karakter',
            'any.required': 'Nama kategori wajib diisi'
        })
});

const updateCategorySchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};