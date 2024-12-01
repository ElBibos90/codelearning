import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCachedData, cacheData } from '../config/redis.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
      const cacheKey = `dashboard:${req.user.id}`;
      
      if (!SERVER_CONFIG.isTest) {
          const cachedData = await getCachedData(cacheKey);
          if (cachedData) {
              return res.json({
                  success: true,
                  dashboard: cachedData
              });
          }
      }

      const userQuery = await pool.query(`
          SELECT 
              id, 
              name, 
              email, 
              role, 
              created_at,
              last_login
          FROM users 
          WHERE id = $1
      `, [req.user.id]);

      const statsQuery = await pool.query(`
          SELECT 
              COUNT(DISTINCT ce.course_id) as total_courses,
              COUNT(DISTINCT CASE WHEN ce.completed THEN ce.course_id END) as completed_courses,
              COUNT(DISTINCT CASE WHEN NOT ce.completed THEN ce.course_id END) as ongoing_courses
          FROM course_enrollments ce
          WHERE ce.user_id = $1
      `, [req.user.id]);

      const user = userQuery.rows[0];
      const stats = statsQuery.rows[0];

      const dashboardData = {
          user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              memberSince: user.created_at,
              lastLogin: user.last_login
          },
          stats: {
              totalCorsi: parseInt(stats.total_courses) || 0,
              corsiCompleti: parseInt(stats.completed_courses) || 0,
              corsiInCorso: parseInt(stats.ongoing_courses) || 0,
              ultimoAccesso: user.last_login
          }
      };

      if (!SERVER_CONFIG.isTest) {
          await cacheData(cacheKey, dashboardData, 300);
      }

      res.json({
          success: true,
          dashboard: dashboardData
      });
  } catch (error) {
      if (!SERVER_CONFIG.isTest) {
          console.error('Dashboard Error:', error);
      }
      res.status(500).json({
          success: false,
          message: 'Errore nel recupero della dashboard',
          error: error.message
      });
  }
});

router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Nessun dato da aggiornare fornito'
      });
    }

    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updateFields = [];
    
    if (name) {
      updateFields.push(`name = $${updateFields.length + 1}`);
      updateValues.push(name);
    }
    
    if (email) {
      // Verifica se l'email è già in uso
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email già in uso'
        });
      }
      
      updateFields.push(`email = $${updateFields.length + 1}`);
      updateValues.push(email);
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE id = $${updateFields.length + 1} RETURNING *`;
    updateValues.push(req.user.id);

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });

  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      stats: {
        tempoTotale: "0h",
        ultimoAccesso: new Date(),
        sessioniCompletate: 0,
        mediaPunteggio: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;