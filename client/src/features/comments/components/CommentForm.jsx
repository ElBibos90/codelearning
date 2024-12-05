import { useState } from 'react';
import { Loader } from 'lucide-react';

export default function CommentForm({ onSubmit, isSubmitting, initialValue = '', isReply = false }) {
  const [content, setContent] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSubmit(content);
    if (!isReply) {
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={isReply ? 2 : 3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder={isReply ? "Scrivi una risposta..." : "Aggiungi un commento..."}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Pubblicazione...
            </>
          ) : (
            isReply ? 'Rispondi' : 'Pubblica'
          )}
        </button>
      </div>
    </form>
  );
}