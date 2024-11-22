import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import RichTextEditor from './RichTextEditor';
import api from '../../../services/api';

export default function LessonForm({ isOpen, onClose, courseId, lesson = null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order_number: 1,
    video_url: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        content: lesson.content || '',
        order_number: lesson.order_number || 1,
        video_url: lesson.video_url || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        order_number: 1,
        video_url: ''
      });
    }
    setError('');
  }, [lesson, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      try {
        if (lesson) {
          const response = await api.put(`/admin/lessons/${lesson.id}`, data);
          return response.data;
        } else {
          const response = await api.post(`/admin/courses/${courseId}/lessons`, data);
          return response.data;
        }
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Si è verificato un errore durante il salvataggio');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync(formData);
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lesson ? `Modifica Lezione: ${lesson.title}` : 'Nuova Lezione'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Titolo della lezione
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenuto della lezione
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ordine
            </label>
            <input
              type="number"
              min="1"
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) || 1 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL Video (opzionale)
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                {lesson ? 'Salvataggio...' : 'Creazione...'}
              </span>
            ) : (
              lesson ? 'Salva Modifiche' : 'Crea Lezione'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}