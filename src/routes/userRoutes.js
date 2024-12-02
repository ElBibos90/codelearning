import express from 'express';
import { userModel } from '../models/userModel.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const user = await userModel.create(req.body);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Registration Error:', error);
        }
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

export default router;