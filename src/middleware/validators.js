import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

export const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Email non valida'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)  // Modificato il regex per matchare almeno una lettera e un numero
        .withMessage('Password deve contenere almeno 8 caratteri, una lettera e un numero'),
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Nome deve contenere almeno 2 caratteri'),
    validateRequest
];

export const courseValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Titolo richiesto')
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
        .withMessage('Durata deve essere almeno 1 ora'),
    validateRequest
];

export const lessonValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Titolo richiesto')
        .isLength({ min: 3, max: 255 }),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Contenuto richiesto'),
    body('courseId')
        .isInt({ min: 1 })
        .withMessage('ID corso non valido'),
    body('orderNumber')
        .isInt({ min: 1 })
        .withMessage('Numero ordine non valido'),
    validateRequest
];