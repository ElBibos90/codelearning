import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/environments.js';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role 
    },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token di accesso non fornito' 
      });
    }

    jwt.verify(token, JWT_CONFIG.secret, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          success: false,
          message: 'Token non valido o scaduto' 
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Accesso negato: richiesti privilegi di amministratore' 
    });
  }
};