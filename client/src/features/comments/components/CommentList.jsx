import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Edit2, Trash2, Reply } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { useSelector } from 'react-redux';
import commentService from '../../services/commentService';
import CommentForm from './CommentForm';

export default function CommentList({ comments, lessonId }) {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const queryClient = useQueryClient();
  const currentUser = useSelector(state => state.auth.user);

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }) => commentService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', lessonId]);
      setEditingCommentId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', lessonId]);
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }) => commentService.replyToComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', lessonId]);
      setReplyingToId(null);
    }
  });

  const handleDelete = (commentId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo commento?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const renderComment = (comment) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToId === comment.id;
    const canModify = currentUser?.id === comment.user_id || currentUser?.role === 'admin';

    return (
      <div key={comment.id} className="flex space-x-4 py-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {comment.user_name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{comment.user_name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>

            {canModify && (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-5 w-5" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setEditingCommentId(comment.id)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <Edit2 className="mr-3 h-4 w-4" /> Modifica
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-red-600`}
                      >
                        <Trash2 className="mr-3 h-4 w-4" /> Elimina
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              initialValue={comment.content}
              onSubmit={(content) => updateMutation.mutate({ commentId: comment.id, content })}
              isSubmitting={updateMutation.isLoading}
            />
          ) : (
            <>
              <p className="mt-1 text-gray-900">{comment.content}</p>
              <button
                onClick={() => setReplyingToId(comment.id)}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <Reply className="mr-1 h-4 w-4" /> Rispondi
              </button>
            </>
          )}

          {isReplying && (
            <div className="mt-4">
              <CommentForm
                onSubmit={(content) => replyMutation.mutate({ commentId: comment.id, content })}
                isSubmitting={replyMutation.isLoading}
                isReply
              />
            </div>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-4 pl-6 border-l-2 border-gray-100">
              {comment.replies.map((reply) => (
                renderComment(reply)
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {comments.map(renderComment)}
    </div>
  );
}