// src/routes/userRoutes.js

import express from 'express';
import { userModel } from '../models/userModel.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const user = await userModel.create(req.body);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

export default router;