import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    ['link', 'image', 'video'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'indent',
  'link', 'image', 'video',
  'color', 'background', 'align',
  'direction', 'script'
];

export default function LessonEditor({ lesson, onClose, onSave }) {
  const [editingLesson, setEditingLesson] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
    video_url: lesson?.video_url || '',
    order_number: lesson?.order_number || 1,
    resources: lesson?.resources || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...lesson,  // Mantiene l'ID e altri campi originali
      ...editingLesson
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Modifica Lezione</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titolo</label>
              <input
                type="text"
                value={editingLesson.title}
                onChange={e => setEditingLesson(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contenuto</label>
              <div className="h-[400px] border rounded-md">
                <ReactQuill
                  theme="snow"
                  value={editingLesson.content}
                  onChange={content => setEditingLesson(prev => ({
                    ...prev,
                    content
                  }))}
                  modules={modules}
                  formats={formats}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL Video (opzionale)</label>
              <input
                type="url"
                value={editingLesson.video_url}
                onChange={e => setEditingLesson(prev => ({
                  ...prev,
                  video_url: e.target.value
                }))}
                className="w-full p-2 border rounded-md"
                placeholder="https://..."
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}