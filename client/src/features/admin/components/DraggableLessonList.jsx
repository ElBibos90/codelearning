import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import LessonEditorDialog from './LessonEditorDialog';

export default function DraggableLessonList({ lessons, onReorder, onDelete, onEdit }) {
  const [editingLesson, setEditingLesson] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_number: index + 1
    }));

    onReorder(updatedItems);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lessons">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {lessons.map((lesson, index) => (
                <Draggable 
                  key={lesson.id} 
                  draggableId={lesson.id.toString()} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-2 bg-white rounded-lg shadow border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div {...provided.dragHandleProps} className="cursor-move text-gray-400">
                            ⋮⋮
                          </div>
                          <div>
                            <h3 className="font-medium">{lesson.title}</h3>
                            <p className="text-sm text-gray-500">
                              Ordine: {lesson.order_number} • 
                              {lesson.video_url && ' Video • '}
                              {lesson.resources?.length > 0 && 
                                `${lesson.resources.length} risorse`}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingLesson(lesson)}
                            className="p-2 text-blue-600 hover:text-blue-700"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Sei sicuro di voler eliminare questa lezione?')) {
                                onDelete(lesson.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editingLesson && (
        <LessonEditorDialog
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={(updatedLesson) => {
            onEdit(updatedLesson);
            setEditingLesson(null);
          }}
        />
      )}
    </>
  );
}