import api from './api';

export const commentService = {
  async getComments(lessonId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/comments/lesson/${lessonId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nel caricamento dei commenti');
    }
  },

  async addComment(lessonId, content) {
    try {
      const response = await api.post(`/comments/lesson/${lessonId}`, { content });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nella pubblicazione del commento');
    }
  },

  async updateComment(commentId, content) {
    try {
      const response = await api.put(`/comments/${commentId}`, { content });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nella modifica del commento');
    }
  },

  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'eliminazione del commento');
    }
  },

  async replyToComment(commentId, content) {
    try {
      const response = await api.post(`/comments/${commentId}/replies`, { content });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nella pubblicazione della risposta');
    }
  }
};

export default commentService;