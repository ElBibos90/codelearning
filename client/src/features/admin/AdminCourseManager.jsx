import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import CourseForm from './components/CourseForm';
import LessonForm from './components/LessonForm';
import api from '../../services/api';

export default function AdminCourseManager() {
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [addingLessonForCourse, setAddingLessonForCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId) => {
      await api.delete(`/admin/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId) => {
      await api.delete(`/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
    }
  });

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo corso?')) {
      deleteMutation.mutate(courseId);
    }
  };

  const handleDeleteLesson = (lessonId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa lezione?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header con pulsante di creazione */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                Gestione Corsi
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Crea, modifica ed elimina i corsi della piattaforma
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                onClick={() => setIsAddingCourse(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuovo Corso
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse bg-white h-24 rounded-lg"></div>
              ))}
            </div>
          )}

          {/* Lista corsi */}
          {!isLoading && (
            <div className="mt-8 space-y-4">
              {courses?.data?.map((course) => (
                <div key={course.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    {/* Header del corso */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {expandedCourse === course.id ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {course.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {course.lessons?.length || 0} lezioni • {course.duration_hours} ore • 
                            Livello {course.difficulty_level}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Lista lezioni espandibile */}
                    {expandedCourse === course.id && (
                      <div className="mt-6">
                        <button
                          onClick={() => setAddingLessonForCourse(course.id)}
                          className="mb-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Lezione
                        </button>

                        <div className="space-y-2">
                          {course.lessons?.map((lesson, index) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 w-8">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="font-medium">{lesson.title}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingLesson(lesson)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {!course.lessons?.length && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Nessuna lezione presente. Aggiungi la prima lezione!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!courses?.data?.length && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nessun corso presente
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Inizia creando il tuo primo corso
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsAddingCourse(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nuovo Corso
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modali */}
      <CourseForm
        isOpen={isAddingCourse}
        onClose={() => setIsAddingCourse(false)}
      />

      <CourseForm
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        course={editingCourse}
      />

      <LessonForm
        isOpen={!!addingLessonForCourse}
        onClose={() => setAddingLessonForCourse(null)}
        courseId={addingLessonForCourse}
      />

      <LessonForm
        isOpen={!!editingLesson}
        onClose={() => setEditingLesson(null)}
        courseId={editingLesson?.course_id}
        lesson={editingLesson}
      />
    </div>
  );
}