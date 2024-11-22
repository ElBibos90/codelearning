import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';

export default function LessonNavigation() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId)
  });

  useEffect(() => {
    if (courseData?.data?.lessons) {
      const index = courseData.data.lessons.findIndex(
        lesson => lesson.id === parseInt(lessonId)
      );
      setCurrentLessonIndex(index);
    }
  }, [courseData, lessonId]);

  const goToLesson = (index) => {
    if (courseData?.data?.lessons[index]) {
      navigate(`/courses/${courseId}/lessons/${courseData.data.lessons[index].id}`);
    }
  };

  if (!courseData?.data?.lessons?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Navigazione Lezioni</h3>
          <span className="text-sm text-gray-500">
            {currentLessonIndex + 1} di {courseData.data.lessons.length}
          </span>
        </div>

        <div className="relative pt-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentLessonIndex + 1) / courseData.data.lessons.length) * 100}%` 
              }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {courseData.data.lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => goToLesson(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  index === currentLessonIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  <span className={`
                    flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3
                    ${index === currentLessonIndex ? 'bg-blue-600 text-white' : 'bg-gray-200'}
                  `}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      index === currentLessonIndex ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {lesson.title}
                    </h4>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => goToLesson(currentLessonIndex - 1)}
            disabled={currentLessonIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-700"
          >
            ← Precedente
          </button>
          
          <button
            onClick={() => goToLesson(currentLessonIndex + 1)}
            disabled={currentLessonIndex === courseData.data.lessons.length - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-700"
          >
            Successiva →
          </button>
        </div>
      </div>
    </div>
  );
}