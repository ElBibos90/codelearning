import api from './api';
import { store } from '../store';
import { logout as logoutAction } from '../store/authSlice';

export const authService = {
  async login(email, password) {
    try {
      // Rimuoviamo /api/ anche qui
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
      // Rimuoviamo /api/ perché è già nel baseURL
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Troppe richieste. Per favore attendi qualche minuto prima di riprovare.');
      }
      throw new Error(error.response?.data?.message || 'Errore durante la registrazione');
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      // Continua con il logout lato client anche se la chiamata al server fallisce
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      store.dispatch(logoutAction());
      window.location.href = '/login';
    }
  }
};