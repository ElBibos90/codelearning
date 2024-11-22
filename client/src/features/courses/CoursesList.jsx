import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Loader } from 'lucide-react';
import CourseCard from './components/CourseCard';
import { courseService } from '../../services/courseService';

export default function CoursesList() {
  const [filters, setFilters] = useState({
    difficulty: '',
    search: ''
  });

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAllCourses,
    retry: 1
  });

  const courses = coursesData?.data || [];

  const filteredCourses = courses.filter(course => {
    if (filters.difficulty && course.difficulty_level !== filters.difficulty) {
      return false;
    }
    if (filters.search && !course.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Si è verificato un errore nel caricamento dei corsi.
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-500 underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Corsi Disponibili
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esplora i nostri corsi e inizia il tuo percorso di apprendimento
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Cerca corsi..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        <div className="sm:w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
            >
              <option value="">Tutti i livelli</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzato</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg"></div>
              <div className="mt-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses?.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCourses?.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun corso trovato</h3>
          <p className="mt-1 text-sm text-gray-500">
            Prova a modificare i filtri di ricerca
          </p>
        </div>
      )}
    </div>
  );
}