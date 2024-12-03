// src/services/CourseService.js
import BaseService from './BaseService';
import { courseModel } from '../models/courseModel';
import { ValidationError, DatabaseError } from '../utils/errors';
import { sanitizeContent } from '../utils/sanitize';

class CourseService extends BaseService {
    constructor() {
        super(courseModel);
        this.searchableFields = ['title', 'description'];
    }

    validate(data) {
        const errors = [];
        
        if (!data.title || data.title.length < 3) {
            errors.push({
                field: 'title',
                message: 'Title must be at least 3 characters long'
            });
        }

        if (data.difficulty_level && 
            !['beginner', 'intermediate', 'advanced'].includes(data.difficulty_level)) {
            errors.push({
                field: 'difficulty_level',
                message: 'Invalid difficulty level'
            });
        }

        if (data.duration_hours && (isNaN(data.duration_hours) || data.duration_hours < 1)) {
            errors.push({
                field: 'duration_hours',
                message: 'Duration must be a positive number'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Course validation failed', errors);
        }
    }

    async create(courseData) {
        try {
            this.validate(courseData);

            // Sanitize content
            if (courseData.description) {
                courseData.description = sanitizeContent(courseData.description);
            }

            const course = await this.model.create(courseData);
            return course;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to create course', error);
        }
    }

    async getWithLessons(courseId) {
        try {
            const course = await this.model.getWithLessons(courseId);
            if (!course) {
                throw new ValidationError('Course not found');
            }
            return course;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch course with lessons', error);
        }
    }

    async search(query, options = {}) {
        try {
            const { difficulty, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = options;
            
            return await this.model.search(query, {
                difficulty,
                page,
                limit,
                sortBy,
                sortOrder
            });
        } catch (error) {
            throw new DatabaseError('Failed to search courses', error);
        }
    }

    async publish(courseId) {
        try {
            //console.log('Starting publish process for course:', courseId);
    
            // Verifica corso
            const course = await this.findById(courseId);
            //console.log('Found course:', course);
    
            if (!course) {
                throw new ValidationError('Course not found');
            }
    
            // Verifica lezioni
            const lessonsCount = await this.model.getLessonsCount(courseId);
            //console.log('Lessons count:', lessonsCount);
    
            if (lessonsCount === 0) {
                // Questo errore non dovrebbe essere catturato e trasformato
                throw new ValidationError('Cannot publish course without lessons');
            }
    
            // Pubblica
            const publishedCourse = await this.model.updateStatus(courseId, 'published');
            //console.log('Published course result:', publishedCourse);
    
            if (!publishedCourse) {
                throw new ValidationError('Failed to update course status');
            }
    
            return publishedCourse;
    
        } catch (error) {
            console.error('Publish error:', error.message, error.stack);
            // Cambiamo questa parte per preservare gli errori di validazione
            if (error instanceof ValidationError) {
                throw error;  // Rilancia l'errore di validazione originale
            }
            throw new DatabaseError('Failed to publish course', error);
        }
    }

    async enrollUser(courseId, userId) {
        try {
            // Verifica se l'utente è già iscritto
            const isEnrolled = await this.model.checkEnrollment(courseId, userId);
            if (isEnrolled) {
                throw new ValidationError('User already enrolled in this course');
            }

            return await this.model.createEnrollment(courseId, userId);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to enroll user', error);
        }
    }

    async getUserProgress(courseId, userId) {
        try {
            return await this.model.getUserProgress(courseId, userId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch user progress', error);
        }
    }

    async getCourseStats(courseId) {
        try {
            return await this.model.getCourseStats(courseId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch course stats', error);
        }
    }
}

export default new CourseService();