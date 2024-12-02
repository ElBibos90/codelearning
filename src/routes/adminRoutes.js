import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import { DB_CONFIG, SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

// Middleware per proteggere tutte le route admin
router.use(authenticateToken, isAdmin);

router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', l.id,
            'title', l.title,
            'content', l.content,
            'order_number', l.order_number,
            'created_at', l.created_at
          ) ORDER BY l.order_number
        ) FILTER (WHERE l.id IS NOT NULL) as lessons
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error in GET /admin/courses:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei corsi'
    });
  }
});

router.post('/courses', async (req, res) => {
  const { title, description, difficulty_level, duration_hours } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO courses (title, description, difficulty_level, duration_hours)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, difficulty_level, duration_hours]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in POST /admin/courses:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del corso'
    });
  }
});

router.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, difficulty_level, duration_hours } = req.body;

  try {
    const result = await pool.query(
      `UPDATE courses 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           difficulty_level = COALESCE($3, difficulty_level),
           duration_hours = COALESCE($4, duration_hours),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, difficulty_level, duration_hours, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Corso non trovato'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in PUT /admin/courses/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del corso'
    });
  }
});

router.delete('/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Corso non trovato'
      });
    }

    res.json({
      success: true,
      message: 'Corso eliminato con successo'
    });
  } catch (error) {
    console.error('Error in DELETE /admin/courses/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del corso'
    });
  }
});

router.post('/courses/:courseId/lessons', async (req, res) => {
  const { courseId } = req.params;
  const { title, content, order_number } = req.body;

  try {
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Corso non trovato'
      });
    }

    const result = await pool.query(
      `INSERT INTO lessons (course_id, title, content, order_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, title, content, order_number]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in POST /admin/courses/:courseId/lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della lezione'
    });
  }
});

router.put('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, order_number } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           order_number = COALESCE($3, order_number)
       WHERE id = $4
       RETURNING *`,
      [title, content, order_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lezione non trovata'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in PUT /admin/lessons/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della lezione'
    });
  }
});

router.delete('/lessons/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM lessons WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lezione non trovata'
      });
    }

    res.json({
      success: true,
      message: 'Lezione eliminata con successo'
    });
  } catch (error) {
    console.error('Error in DELETE /admin/lessons/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della lezione'
    });
  }
});

export default router;