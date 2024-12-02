// src/services/CourseService.js
import BaseService from './BaseService';
import { courseModel } from '../models/courseModel';
import { ValidationError } from '../utils/errors';
import { sanitizeContent } from '../utils/sanitize';
import { publishEvent } from '../events/eventBus';

class CourseService extends BaseService {
    constructor() {
        super(courseModel);
    }

    // Override validation with specific course rules
    validate(data) {
        const errors = [];
        
        if (!data.title || data.title.length < 3) {
            errors.push({
                field: 'title',
                message: 'Title must be at least 3 characters long'
            });
        }

        if (!data.difficulty_level || 
            !['beginner', 'intermediate', 'advanced'].includes(data.difficulty_level)) {
            errors.push({
                field: 'difficulty_level',
                message: 'Invalid difficulty level'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Course validation failed', errors);
        }
    }

    // Override base methods to add specific business logic
    async beforeCreate(data) {
        // Sanitize content
        if (data.description) {
            data.description = sanitizeContent(data.description);
        }
        
        // Validate data
        this.validate(data);
        
        return data;
    }

    async afterCreate(result) {
        // Publish event for other parts of the system
        await publishEvent('course.created', {
            courseId: result.id,
            title: result.title,
            timestamp: new Date()
        });
        
        return result;
    }

    // Custom business methods
    async publish(courseId) {
        const course = await this.findById(courseId);
        
        // Business logic validation
        if (course.lessons.length === 0) {
            throw new ValidationError('Cannot publish course without lessons');
        }

        const result = await this.update(courseId, {
            status: 'published',
            publishedAt: new Date()
        });

        await publishEvent('course.published', {
            courseId: result.id,
            title: result.title,
            timestamp: new Date()
        });

        return result;
    }

    async addLesson(courseId, lessonData) {
        const course = await this.findById(courseId);
        
        // Business logic validation
        if (course.status === 'published') {
            throw new ValidationError('Cannot add lessons to published course');
        }

        // Add lesson implementation...
    }
}

export default new CourseService();