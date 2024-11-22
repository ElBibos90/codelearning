export const LessonContent = ({ lesson }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-4">{lesson?.title}</h1>
      <div className="prose max-w-none">
        <div className="text-gray-800 leading-relaxed">
          {lesson?.content}
        </div>
      </div>
    </div>
  );
};