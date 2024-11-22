// src/features/lessons/components/LessonHeader.jsx
// Componente per l'intestazione della lezione
export const LessonHeader = ({ courseTitle, courseId, onBack }) => {
  return (
    <div className="mb-4">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
      >
        ← Torna al corso {courseTitle}
      </button>
    </div>
  );
};