// src/validators/schemas.js
import { body } from 'express-validator';

export const authValidation = {
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email non valida'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
            .withMessage('Password deve contenere almeno 8 caratteri, una lettera e un numero'),
        body('name')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Nome deve contenere almeno 2 caratteri')
    ],
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email non valida'),
        body('password')
            .notEmpty()
            .withMessage('Password richiesta')
    ]
};

export const courseValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .isLength({ min: 3, max: 255 })
            .withMessage('Titolo deve essere tra 3 e 255 caratteri'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('Descrizione richiesta'),
        body('difficulty_level')
            .isIn(['beginner', 'intermediate', 'advanced'])
            .withMessage('Livello difficoltà non valido'),
        body('duration_hours')
            .isInt({ min: 1 })
            .withMessage('Durata deve essere almeno 1 ora')
    ]
};

export const lessonValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .isLength({ min: 3, max: 255 })
            .withMessage('Titolo deve essere tra 3 e 255 caratteri'),
        body('content')
            .trim()
            .notEmpty()
            .withMessage('Contenuto richiesto'),
        body('courseId')
            .isInt({ min: 1 })
            .withMessage('ID corso non valido'),
        body('orderNumber')
            .isInt({ min: 1 })
            .withMessage('Numero ordine non valido')
    ]
};