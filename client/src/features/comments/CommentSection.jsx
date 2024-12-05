import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import commentService from '../../services/commentService';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

export default function CommentSection({ lessonId }) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const limit = 10;

  const {
    data: comments,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['comments', lessonId, page],
    queryFn: () => commentService.getComments(lessonId, page, limit),
    getNextPageParam: (lastPage) => lastPage.hasMore ? page + 1 : undefined
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ content }) => commentService.addComment(lessonId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', lessonId]);
    }
  });

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Errore nel caricamento dei commenti
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Commenti
          {comments?.totalCount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({comments.totalCount})
            </span>
          )}
        </h2>
      </div>

      <CommentForm 
        onSubmit={(content) => addCommentMutation.mutate({ content })}
        isSubmitting={addCommentMutation.isLoading}
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <CommentList 
              comments={comments?.data || []}
              lessonId={lessonId}
            />
            
            {hasNextPage && (
              <button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Caricamento...' : 'Carica altri commenti'}
              </button>
            )}

            {!comments?.data?.length && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nessun commento
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Inizia la discussione aggiungendo un commento.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}