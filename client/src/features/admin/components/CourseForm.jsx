import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import api from '../../../services/api';

export default function CourseForm({ isOpen, onClose, course = null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    duration_hours: 1
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        difficulty_level: course.difficulty_level || 'beginner',
        duration_hours: course.duration_hours || 1
      });
    } else {
      // Reset form quando si apre per un nuovo corso
      setFormData({
        title: '',
        description: '',
        difficulty_level: 'beginner',
        duration_hours: 1
      });
    }
    setError('');
  }, [course, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (course) {
        const response = await api.put(`/admin/courses/${course.id}`, data);
        return response.data;
      }
      const response = await api.post('/admin/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Si è verificato un errore');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    mutation.mutate(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? `Modifica Corso: ${course.title}` : 'Nuovo Corso'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Titolo del corso
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descrizione
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
              Livello di difficoltà
            </label>
            <select
              id="difficulty_level"
              value={formData.difficulty_level}
              onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzato</option>
            </select>
          </div>

          <div>
            <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700">
              Durata (ore)
            </label>
            <input
              type="number"
              id="duration_hours"
              min="1"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {mutation.isLoading ? (
              <span className="flex items-center">
                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                {course ? 'Salvataggio...' : 'Creazione...'}
              </span>
            ) : (
              course ? 'Salva Modifiche' : 'Crea Corso'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}