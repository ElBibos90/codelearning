import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, BookOpen, Trophy, Clock } from 'lucide-react';
import { profileService } from '../../services/profileService';

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    skills: [],
    interests: []
  });

  // Fetch profilo utente
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile
  });

  // Aggiorna il form quando arrivano i dati
  useEffect(() => {
    if (profileData?.data?.profile) {
      setFormData({
        full_name: profileData.data.profile.full_name || '',
        bio: profileData.data.profile.bio || '',
        linkedin_url: profileData.data.profile.linkedin_url || '',
        github_url: profileData.data.profile.github_url || '',
        website_url: profileData.data.profile.website_url || '',
        skills: profileData.data.profile.skills || [],
        interests: profileData.data.profile.interests || []
      });
    }
  }, [profileData]);

  // Mutation per aggiornare il profilo
  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditing(false);
    }
  });

  // Debug: stampa i dati ricevuti
  console.log('Profile Data:', profileData);
  console.log('Form Data:', formData);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Il Mio Profilo</h1>
        <p className="mt-2 text-gray-600">
          Gestisci le tue informazioni personali e visualizza i tuoi progressi
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Corsi Completati</p>
              <p className="text-2xl font-semibold text-gray-900">
                {profileData?.data?.stats?.completed_courses || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lezioni Completate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {profileData?.data?.stats?.total_lessons_completed || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Membro da</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Date(profileData?.data?.member_since).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Profilo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Informazioni Personali
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {isEditing ? 'Annulla' : 'Modifica'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={profileData?.data?.email}
                  disabled
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Links Sociali */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Link Social</h3>
              
              <div>
                <label className="block text-sm text-gray-600">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">GitHub</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Sito Web</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateProfileMutation.isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}