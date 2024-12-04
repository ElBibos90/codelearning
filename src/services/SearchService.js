import BaseService from './BaseService';
import { searchModel } from '../models/searchModel';
import { ValidationError, DatabaseError } from '../utils/errors';

class SearchService extends BaseService {
    constructor() {
        super(searchModel);
    }

    validate(query) {
        if (!query || query.trim().length < 2) {
            throw new ValidationError('Search query must be at least 2 characters long');
        }
    }

    async searchCourses(query, options = {}) {
        try {
            this.validate(query);
            
            // Sanitizza le opzioni
            const validOptions = {
                limit: Math.min(parseInt(options.limit) || 10, 50),
                offset: parseInt(options.offset) || 0,
                difficulty: ['beginner', 'intermediate', 'advanced'].includes(options.difficulty) 
                    ? options.difficulty 
                    : null,
                sortBy: ['rank', 'date'].includes(options.sortBy) ? options.sortBy : 'rank'
            };

            const results = await this.model.searchCourses(query, validOptions);
            return {
                ...results,
                query,
                options: validOptions
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to search courses', error);
        }
    }

    async searchLessons(query, options = {}) {
        try {
            this.validate(query);
            
            const validOptions = {
                limit: Math.min(parseInt(options.limit) || 10, 50),
                offset: parseInt(options.offset) || 0,
                courseId: parseInt(options.courseId) || null,
                sortBy: ['rank', 'date'].includes(options.sortBy) ? options.sortBy : 'rank'
            };

            const results = await this.model.searchLessons(query, validOptions);
            return {
                ...results,
                query,
                options: validOptions
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to search lessons', error);
        }
    }

    async search(query, options = {}) {
        try {
            this.validate(query);

            const [courses, lessons] = await Promise.all([
                this.searchCourses(query, options),
                this.searchLessons(query, options)
            ]);

            return {
                courses: courses.results,
                lessons: lessons.results,
                totalResults: courses.totalCount + lessons.totalCount,
                query
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to perform search', error);
        }
    }

    async getSuggestions(query, type = 'all') {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }

            const validTypes = ['all', 'courses', 'lessons'];
            const validType = validTypes.includes(type) ? type : 'all';

            return await this.model.getSuggestions(query, validType);
        } catch (error) {
            throw new DatabaseError('Failed to get search suggestions', error);
        }
    }
}

export default new SearchService();