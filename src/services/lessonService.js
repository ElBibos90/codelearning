import BaseService from './BaseService';
import { ValidationError, DatabaseError } from '../utils/errors';
import { sanitizeContent } from '../utils/sanitize';
import { lessonTemplates } from '../constants/lessonTemplates';
import { lessonModel } from '../models/lessonModel';

class LessonService extends BaseService {
    constructor() {
        super(lessonModel);
    }

    validate(data) {
        const errors = [];
        
        if (!data.title || data.title.length < 3) {
            errors.push({
                field: 'title',
                message: 'Title must be at least 3 characters long'
            });
        }

        if (!data.courseId) {
            errors.push({
                field: 'courseId',
                message: 'Course ID is required'
            });
        }

        if (data.orderNumber && (!Number.isInteger(data.orderNumber) || data.orderNumber < 1)) {
            errors.push({
                field: 'orderNumber',
                message: 'Order number must be a positive integer'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Lesson validation failed', errors);
        }
    }

    async create(lessonData) {
        try {
            this.validate(lessonData);

            // Applica il template se necessario
            const content = lessonData.content || lessonTemplates[lessonData.templateType || 'theory'];
            
            // Sanitizza il contenuto
            const sanitizedContent = lessonData.contentFormat === 'html' 
                ? sanitizeContent(content)
                : content;

            const dataToCreate = {
                ...lessonData,
                content: sanitizedContent
            };

            const lesson = await this.model.create(dataToCreate);
            return lesson;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to create lesson', error);
        }
    }

    async update(lessonId, updateData, editorId) {
        try {
            if (updateData.content && updateData.content_format === 'html') {
                updateData.content = sanitizeContent(updateData.content);
            }

            const lesson = await this.model.update(lessonId, updateData, editorId);
            return lesson;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to update lesson', error);
        }
    }

    async getVersions(lessonId) {
        try {
            return await this.model.getVersions(lessonId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch lesson versions', error);
        }
    }

    async revertToVersion(lessonId, versionNumber, userId) {
        try {
            return await this.model.revertToVersion(lessonId, versionNumber, userId);
        } catch (error) {
            if (error.message === 'Version not found') {
                throw new ValidationError('Version not found');
            }
            throw new DatabaseError('Failed to revert lesson version', error);
        }
    }

    async updateProgress(lessonId, userId, completed = true) {
        try {
            const result = await this.model.updateProgress(lessonId, userId, completed);
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to update lesson progress', error);
        }
    }

    async getProgress(lessonId, userId) {
        try {
            const result = await this.model.getProgress(lessonId, userId);
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to fetch lesson progress', error);
        }
    }

    async addResource(lessonId, resourceData) {
        try {
            const result = await this.model.addResource(lessonId, resourceData);
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to add lesson resource', error);
        }
    }

    async getResources(lessonId) {
        try {
            const result = await this.model.getResources(lessonId);
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to fetch lesson resources', error);
        }
    }

    async reorderLessons(courseId, orderUpdates) {
        try {
            return await this.model.reorderLessons(courseId, orderUpdates);
        } catch (error) {
            if (error.message === 'One or more lessons not found') {
                throw new ValidationError('One or more lessons not found');
            }
            throw new DatabaseError('Failed to reorder lessons', error);
        }
    }
}

export default new LessonService();