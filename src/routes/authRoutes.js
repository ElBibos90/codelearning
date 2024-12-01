import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { generateToken, authenticateToken, isAdmin } from '../middleware/auth.js';
import { registerValidation } from '../middleware/validators.js';
import { JWT_CONFIG, SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e password sono richiesti' 
      });
    }

    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenziali non valide' 
      });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenziali non valide' 
      });
    }

    // Aggiorna last_login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user);

    res.json({ 
      success: true,
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  res.json({ 
    success: true,
    message: 'Profilo utente recuperato con successo',
    user: req.user 
  });
});

router.get('/admin', authenticateToken, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Accesso admin consentito',
    user: req.user
  });
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      success: true,
      message: 'Logout effettuato con successo' 
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
      
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        errors: [{ msg: 'Email già registrata' }]
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
      
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registrazione completata con successo'
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token non fornito'
      });
    }

    // Verifica e rinnova il token
    const user = jwt.verify(refreshToken, JWT_CONFIG.secret);
    const newToken = generateToken(user);

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token non valido o scaduto'
    });
  }
});

export default router;