import api from './api';
import { store } from '../store';
import { logout as logoutAction } from '../store/authSlice';

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error('Token non trovato nella risposta');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore durante il login');
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore durante la registrazione');
    }
  },

  async logout() {
    try {
      // Chiamata al backend per invalidare il token (opzionale)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      // Pulizia locale anche se la chiamata al backend fallisce
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch dell'azione logout di Redux
      store.dispatch(logoutAction());
      // Redirect al login
      window.location.href = '/login';
    }
  }
};