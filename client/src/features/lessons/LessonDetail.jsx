import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function LessonDetail() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch dettagli lezione
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const response = await api.get(`/lessons/${lessonId}/detail`);
      return response.data;
    },
    retry: 1
  });

  // Mutation per segnare la lezione come completata
  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/lessons/${lessonId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson', lessonId]);
      queryClient.invalidateQueries(['course', courseId]);
    }
  });

  // Registra la visualizzazione della lezione
  useEffect(() => {
    const trackProgress = async () => {
      try {
        await api.post(`/lessons/${lessonId}/progress`);
      } catch (error) {
        console.error('Error tracking lesson progress:', error);
      }
    };
    trackProgress();
  }, [lessonId]);

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
            Si è verificato un errore nel caricamento della lezione.
          </p>
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4 text-red-600 hover:text-red-500"
          >
            Torna al corso
          </button>
        </div>
      </div>
    );
  }

  const lessonData = lesson?.data;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Torna al corso
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {lessonData?.completed ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Completata
                </span>
              ) : (
                <button
                  onClick={() => completeLessonMutation.mutate()}
                  disabled={completeLessonMutation.isLoading}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Segna come completata
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500">
            <ol className="flex items-center space-x-2">
              <li>
                <a href={`/courses/${courseId}`} className="hover:text-gray-700">
                  {lessonData?.course_title}
                </a>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li>Lezione {lessonData?.order_number}</li>
            </ol>
          </nav>
        </div>

        {/* Lesson Content */}
        <article className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {lessonData?.title}
          </h1>

          {/* Video (if available) */}
          {lessonData?.video_url && (
            <div className="aspect-w-16 aspect-h-9 mb-8">
              <iframe
                src={lessonData.video_url}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          )}

          {/* Content */}
          <div 
            className="mt-6 text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: lessonData?.content }}
          />

          {/* Resources */}
          {lessonData?.resources?.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-xl font-bold mb-4">Risorse aggiuntive</h2>
              <div className="grid gap-4">
                {lessonData.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{resource.title}</div>
                      {resource.description && (
                        <div className="text-sm text-gray-500">
                          {resource.description}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Navigation between lessons */}
        <div className="mt-12 border-t pt-6">
          <div className="flex items-center justify-between">
            {lessonData?.prev_lesson ? (
              <button
                onClick={() => navigate(`/courses/${courseId}/lessons/${lessonData.prev_lesson}`)}
                className="flex items-center text-blue-600 hover:text-blue-500"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Lezione precedente
              </button>
            ) : (
              <div></div>
            )}
            {lessonData?.next_lesson && (
              <button
                onClick={() => navigate(`/courses/${courseId}/lessons/${lessonData.next_lesson}`)}
                className="flex items-center text-blue-600 hover:text-blue-500"
              >
                Prossima lezione
                <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}