import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import SearchService from '../services/SearchService.js';
import { SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { q: query, type } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        const options = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0,
            sortBy: req.query.sortBy
        };

        const results = await SearchService.search(query, options);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error in search:', error);
        }
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Errore durante la ricerca'
        });
    }
});

router.get('/courses', authenticateToken, async (req, res) => {
    try {
        const { q: query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        const options = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0,
            difficulty: req.query.difficulty,
            sortBy: req.query.sortBy
        };

        const results = await SearchService.searchCourses(query, options);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error in course search:', error);
        }
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Errore durante la ricerca dei corsi'
        });
    }
});

router.get('/lessons', authenticateToken, async (req, res) => {
    try {
        const { q: query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        const options = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0,
            courseId: parseInt(req.query.courseId),
            sortBy: req.query.sortBy
        };

        const results = await SearchService.searchLessons(query, options);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error in lesson search:', error);
        }
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Errore durante la ricerca delle lezioni'
        });
    }
});

router.get('/suggestions', authenticateToken, async (req, res) => {
    try {
        const { q: query, type } = req.query;
        
        if (!query) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await SearchService.getSuggestions(query, type);
        
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error in search suggestions:', error);
        }
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Errore durante il recupero dei suggerimenti'
        });
    }
});

export default router;