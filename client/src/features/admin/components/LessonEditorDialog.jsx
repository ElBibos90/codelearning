import React, { useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['table'],
      ['formula'],
      ['clean']
    ]
  },
  clipboard: {
    matchVisual: false
  }
};

export default function LessonEditorDialog({ lesson, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('content');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingLesson, setEditingLesson] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
    video_url: lesson?.video_url || '',
    order_number: lesson?.order_number || 1,
    resources: lesson?.resources || []
  });

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('Ci sono modifiche non salvate. Vuoi davvero chiudere?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleChange = useCallback((field, value) => {
    setEditingLesson(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header with tabs */}
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Modifica Lezione</h2>
              <p className="text-sm text-gray-500">Lezione {editingLesson.order_number}</p>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent'
              }`}
            >
              Contenuto
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'media' ? 'border-blue-500 text-blue-600' : 'border-transparent'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'resources' ? 'border-blue-500 text-blue-600' : 'border-transparent'
              }`}
            >
              Risorse
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activeTab === 'content' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Titolo</label>
                  <input
                    type="text"
                    value={editingLesson.title}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Contenuto</label>
                    <button
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {isPreviewMode ? 'Modifica' : 'Anteprima'}
                    </button>
                  </div>
                  {isPreviewMode ? (
                    <div 
                      className="prose max-w-none p-4 border rounded-md min-h-[500px] bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: editingLesson.content }}
                    />
                  ) : (
                    <div className="h-[500px] border rounded-md">
                      <ReactQuill
                        theme="snow"
                        value={editingLesson.content}
                        onChange={content => handleChange('content', content)}
                        modules={modules}
                        className="h-full"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">URL Video</label>
                  <input
                    type="url"
                    value={editingLesson.video_url}
                    onChange={e => handleChange('video_url', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://..."
                  />
                  {editingLesson.video_url && (
                    <div className="mt-4 aspect-video">
                      <iframe
                        src={editingLesson.video_url}
                        className="w-full h-full rounded-md"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Allegati</label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      // Gestire il drop dei file
                    }}
                  >
                    <p className="text-gray-500">
                      Trascina qui i file o <span className="text-blue-600">sfoglia</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

{activeTab === 'resources' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="font-medium">Risorse della lezione</h3>
      <button
        onClick={() => {
          const title = window.prompt('Titolo della risorsa:');
          if (!title) return;
          
          const url = window.prompt('URL della risorsa:');
          if (!url) return;
          
          const type = window.prompt('Tipo di risorsa (pdf, link, code, github):', 'pdf');
          if (!type) return;

          const description = window.prompt('Descrizione (opzionale):');
          
          handleChange('resources', [
            ...editingLesson.resources,
            { title, url, type, description }
          ]);
        }}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Aggiungi Risorsa
      </button>
    </div>

    {editingLesson.resources.length > 0 ? (
      <div className="space-y-3">
        {editingLesson.resources.map((resource, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-md">
                {resource.type === 'pdf' && '📄'}
                {resource.type === 'link' && '🔗'}
                {resource.type === 'code' && '💻'}
                {resource.type === 'github' && '🐙'}
              </div>
              <div>
                <h4 className="font-medium">{resource.title}</h4>
                <div className="text-sm text-gray-500 space-x-2">
                  <span>{resource.type.toUpperCase()}</span>
                  {resource.description && (
                    <>
                      <span>•</span>
                      <span>{resource.description}</span>
                    </>
                  )}
                </div>
                <a 
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {resource.url}
                </a>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const title = window.prompt('Titolo della risorsa:', resource.title);
                  if (!title) return;
                  
                  const url = window.prompt('URL della risorsa:', resource.url);
                  if (!url) return;
                  
                  const type = window.prompt('Tipo di risorsa:', resource.type);
                  if (!type) return;

                  const description = window.prompt('Descrizione:', resource.description);
                  
                  const newResources = [...editingLesson.resources];
                  newResources[index] = { title, url, type, description };
                  handleChange('resources', newResources);
                }}
                className="p-1 text-blue-600 hover:text-blue-700 rounded"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Sei sicuro di voler eliminare questa risorsa?')) {
                    const newResources = editingLesson.resources.filter((_, i) => i !== index);
                    handleChange('resources', newResources);
                  }
                }}
                className="p-1 text-red-600 hover:text-red-700 rounded"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <div className="text-gray-500">
          Nessuna risorsa aggiunta
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Clicca su "Aggiungi Risorsa" per iniziare
        </div>
      </div>
    )}

    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-700 mb-2">Tipi di risorse supportati:</h4>
      <ul className="text-sm text-blue-600 space-y-1">
        <li className="flex items-center">
          <span className="mr-2">📄</span> 
          PDF - Documenti e materiali di studio
        </li>
        <li className="flex items-center">
          <span className="mr-2">🔗</span> 
          Link - Collegamenti a risorse esterne
        </li>
        <li className="flex items-center">
          <span className="mr-2">💻</span> 
          Code - Snippet di codice o esempi
        </li>
        <li className="flex items-center">
          <span className="mr-2">🐙</span> 
          GitHub - Repository o gist
        </li>
      </ul>
    </div>
  </div>
)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isDirty ? 'Modifiche non salvate' : 'Tutte le modifiche sono salvate'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onSave(editingLesson);
                  setIsDirty(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}