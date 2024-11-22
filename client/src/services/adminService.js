// src/services/adminService.js
import api from './api';

export const adminService = {
  async getAllCoursesAdmin() {
    try {
      const response = await api.get('/admin/courses');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nel recupero dei corsi');
    }
  },

  async createCourse(courseData) {
    try {
      const response = await api.post('/admin/courses', courseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nella creazione del corso');
    }
  },

  async updateCourse(courseId, courseData) {
    try {
      const response = await api.put(`/admin/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'aggiornamento del corso');
    }
  },

  async deleteCourse(courseId) {
    try {
      const response = await api.delete(`/admin/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'eliminazione del corso');
    }
  },

  async createLesson(courseId, lessonData) {
    try {
      const response = await api.post(`/admin/courses/${courseId}/lessons`, lessonData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nella creazione della lezione');
    }
  },

  async updateLesson(lessonId, lessonData) {
    try {
      const response = await api.put(`/admin/lessons/${lessonId}`, lessonData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'aggiornamento della lezione');
    }
  },

  async deleteLesson(lessonId) {
    try {
      const response = await api.delete(`/admin/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'eliminazione della lezione');
    }
  }
};