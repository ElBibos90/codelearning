import BaseService from './BaseService';
import { commentModel } from '../models/commentModel';
import { ValidationError, DatabaseError } from '../utils/errors';
import { sanitizeContent } from '../utils/sanitize';

class CommentService extends BaseService {
    constructor() {
        super(commentModel);
    }

    validate(data) {
        const errors = [];
        
        if (!data.content || data.content.trim().length < 1) {
            errors.push({
                field: 'content',
                message: 'Content is required'
            });
        }

        if (!data.lessonId) {
            errors.push({
                field: 'lessonId',
                message: 'Lesson ID is required'
            });
        }

        if (!data.userId) {
            errors.push({
                field: 'userId',
                message: 'User ID is required'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Comment validation failed', errors);
        }
    }

    async create(commentData) {
        try {
            this.validate(commentData);

            // Sanitize content
            const sanitizedContent = sanitizeContent(commentData.content);
            
            const comment = await this.model.create({
                ...commentData,
                content: sanitizedContent
            });

            return comment;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to create comment', error);
        }
    }

    async update(commentId, userId, updateData) {
        try {
            // Verifica proprietà del commento
            const isOwner = await this.model.checkOwnership(commentId, userId);
            if (!isOwner) {
                throw new ValidationError('Not authorized to update this comment');
            }

            // Sanitize content
            if (updateData.content) {
                updateData.content = sanitizeContent(updateData.content);
            }

            const comment = await this.model.update(commentId, updateData);
            if (!comment) {
                throw new ValidationError('Comment not found');
            }

            return comment;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to update comment', error);
        }
    }

    async delete(commentId, userId) {
        try {
            // Verifica proprietà del commento
            const isOwner = await this.model.checkOwnership(commentId, userId);
            if (!isOwner) {
                throw new ValidationError('Not authorized to delete this comment');
            }

            const result = await this.model.delete(commentId);
            if (!result) {
                throw new ValidationError('Comment not found');
            }

            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete comment', error);
        }
    }

    async getLessonComments(lessonId) {
        try {
            return await this.model.getLessonComments(lessonId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch lesson comments', error);
        }
    }

    async getUserComments(userId) {
        try {
            return await this.model.getUserComments(userId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch user comments', error);
        }
    }

    async getReplies(commentId) {
        try {
            return await this.model.getReplies(commentId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch comment replies', error);
        }
    }

    async reply(parentCommentId, userId, content) {
        try {
            // Verifica che il commento padre esista
            const parentComment = await this.findById(parentCommentId);
            if (!parentComment) {
                throw new ValidationError('Parent comment not found');
            }

            const sanitizedContent = sanitizeContent(content);

            const reply = await this.create({
                lessonId: parentComment.lesson_id,
                userId,
                content: sanitizedContent,
                parentId: parentCommentId
            });

            return reply;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to create reply', error);
        }
    }
}

export default new CommentService();