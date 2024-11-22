import api from './api';

export const profileService = {
  async getProfile() {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nel recupero del profilo');
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/profile', {
        full_name: profileData.full_name,
        bio: profileData.bio,
        linkedin_url: profileData.linkedin_url,
        github_url: profileData.github_url,
        website_url: profileData.website_url,
        skills: profileData.skills || [],
        interests: profileData.interests || []
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Errore nell\'aggiornamento del profilo');
    }
  }
};

export default profileService;