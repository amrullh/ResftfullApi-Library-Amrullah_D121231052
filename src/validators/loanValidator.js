const Joi = require('joi');

const createLoanSchema = Joi.object({
    bookId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Book ID harus berupa angka',
            'number.integer': 'Book ID harus bilangan bulat',
            'number.positive': 'Book ID harus positif',
            'any.required': 'Book ID wajib diisi'
        }),

    dueDays: Joi.number()
        .integer()
        .min(1)
        .max(30)
        .default(7)
        .messages({
            'number.base': 'Due days harus berupa angka',
            'number.integer': 'Due days harus bilangan bulat',
            'number.min': 'Due days minimal 1 hari',
            'number.max': 'Due days maksimal 30 hari'
        })
});

module.exports = {
    createLoanSchema
};