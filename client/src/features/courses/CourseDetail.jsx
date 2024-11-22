import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock, Users, BookOpen, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch dettagli corso
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    }
  });

  // Mutation per l'iscrizione
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/enrollments/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['course', courseId]);
    }
  });

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync();
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">
            Si è verificato un errore nel caricamento del corso.
          </p>
          <button 
            onClick={() => navigate('/courses')}
            className="mt-4 text-red-600 hover:text-red-500"
          >
            Torna ai corsi
          </button>
        </div>
      </div>
    );
  }

  const courseData = course?.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Torna ai corsi
      </button>

      {/* Course header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {courseData.title}
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            {courseData.description}
          </p>

          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">{courseData.duration_hours} ore</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">{courseData.lessons?.length || 0} lezioni</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">{courseData.enrolled_count || 0} iscritti</span>
            </div>
          </div>

          {/* Enrollment status/button */}
          <div className="mt-8 flex justify-end">
            {courseData.is_enrolled ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Iscritto al corso
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrollMutation.isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {enrollMutation.isLoading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Iscrizione in corso...
                  </>
                ) : (
                  'Iscriviti al corso'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">
            Lezioni del corso
          </h2>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {courseData.lessons?.map((lesson, index) => (
              <li 
                key={lesson.id}
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => {
                  if (courseData.is_enrolled) {
                    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
                  }
                }}
              >
                <div className="px-4 py-4 flex items-center">
                  <span className="text-gray-500 w-12">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-grow font-medium text-gray-900">
                    {lesson.title}
                  </span>
                  {!courseData.is_enrolled && (
                    <span className="text-sm text-gray-500">
                      Iscriviti per accedere
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}