import api from './api';

export const courseService = {
  async getAllCourses() {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nel caricamento dei corsi');
    }
  },

  async getCourseById(id) {
    try {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nel caricamento del corso');
    }
  }
};