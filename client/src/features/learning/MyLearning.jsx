import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Award } from 'lucide-react';
import api from '../../services/api';

export default function MyLearning() {
  const navigate = useNavigate();

  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my-courses');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Il Mio Percorso</h1>
      <p className="mt-2 text-gray-600">Gestisci i tuoi corsi e monitora i tuoi progressi</p>

      <div className="mt-8">
        {enrolledCourses?.data?.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.data.map((course) => (
              <div 
                key={course.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>

                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {course.duration_hours} ore
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {course.completed_lessons} di {course.total_lessons} lezioni completate
                    </div>
                    {course.course_completed && (
                      <div className="flex items-center text-green-600">
                        <Award className="w-4 h-4 mr-2" />
                        Corso completato
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {Math.round((course.completed_lessons / course.total_lessons) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                        <div
                          style={{ width: `${(course.completed_lessons / course.total_lessons) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="mt-4 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {course.course_completed ? 'Rivedi corso' : 'Continua corso'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun corso</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non sei ancora iscritto a nessun corso.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Esplora i corsi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}