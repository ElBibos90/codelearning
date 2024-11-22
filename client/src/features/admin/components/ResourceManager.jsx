import { useState } from 'react';
import { PlusCircle, X, FileText, Link as LinkIcon, Code, Github } from 'lucide-react';

const RESOURCE_TYPES = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'code', label: 'Codice', icon: Code },
  { value: 'github', label: 'GitHub', icon: Github }
];

export default function ResourceManager({ resources = [], onChange }) {
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'pdf',
    description: ''
  });

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url) return;

    onChange([...resources, { ...newResource, id: Date.now() }]);
    setNewResource({ title: '', url: '', type: 'pdf', description: '' });
  };

  const handleRemoveResource = (indexToRemove) => {
    onChange(resources.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Aggiungi Risorsa</h4>
        <form onSubmit={handleAddResource} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titolo
              </label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={newResource.type}
                onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              type="url"
              value={newResource.url}
              onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descrizione (opzionale)
            </label>
            <input
              type="text"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Aggiungi Risorsa
          </button>
        </form>
      </div>

      {resources.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Risorse ({resources.length})</h4>
          <div className="space-y-2">
            {resources.map((resource, index) => {
              const ResourceIcon = RESOURCE_TYPES.find(t => t.value === resource.type)?.icon || FileText;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <ResourceIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">{resource.title}</h5>
                      <p className="text-xs text-gray-500">
                        {RESOURCE_TYPES.find(t => t.value === resource.type)?.label} •{' '}
                        {resource.description}
                      </p>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-500"
                      >
                        {resource.url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveResource(index)}
                    className="p-1 text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}