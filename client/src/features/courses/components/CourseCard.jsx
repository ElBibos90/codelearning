import { useNavigate } from 'react-router-dom';
import { Clock, Users, Book, CheckCircle } from 'lucide-react';

export default function CourseCard({ course }) {
  const navigate = useNavigate();

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzato'
    };
    return labels[level] || level;
  };

  // Calcola la percentuale di completamento in modo sicuro
  const calculateProgress = () => {
    // Se il corso è completato, ritorna 100%
    if (course.completed) return 100;

    if (!course.total_lessons || course.total_lessons === 0) return 0;
    const completedLessons = parseInt(course.completed_lessons || 0);
    const totalLessons = parseInt(course.total_lessons);
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const progressPercentage = calculateProgress();

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Course Image */}
      <div className="aspect-video bg-gray-100 relative">
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
            {getDifficultyLabel(course.difficulty_level)}
          </span>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {course.description}
        </p>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {course.duration_hours}h
          </div>
          <div className="flex items-center">
            <Book className="h-4 w-4 mr-1" />
            {`${course.completed_lessons || 0} di ${course.total_lessons || 0} lezioni`}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {course.enrolled_count || 0} iscritti
          </div>
        </div>

        {/* Progress if enrolled */}
        {course.is_enrolled && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {course.completed ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Corso completato
                  </span>
                ) : (
                  'Progresso'
                )}
              </span>
              <span className="text-gray-900 font-medium">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  course.completed ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}