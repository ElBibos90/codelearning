import BaseService from './BaseService';
import { favoriteModel } from '../models/favoriteModel';
import { ValidationError, DatabaseError } from '../utils/errors';
import { sanitizeContent } from '../utils/sanitize';

class FavoriteService extends BaseService {
    constructor() {
        super(favoriteModel);
    }

    async create(data) {
        // Validazione prima della creazione
        this.validate(data);
        return await super.create(data);
    }

    validate(data) {
        const errors = [];
        
        if (!data.userId) {
            errors.push({
                field: 'userId',
                message: 'User ID is required'
            });
        }

        if (!data.courseId) {
            errors.push({
                field: 'courseId',
                message: 'Course ID is required'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Favorite validation failed', errors);
        }

        return true;
    }

    async addFavorite(userId, courseId, notes = null) {
        try {
            // Verifica se il corso è già nei preferiti
            const existing = await this.model.findByUserAndCourse(userId, courseId);
            if (existing) {
                throw new ValidationError('Course already in favorites');
            }

            // Sanitizza le note se presenti
            const sanitizedNotes = notes ? sanitizeContent(notes) : null;

            const favorite = await this.create({
                userId,
                courseId,
                notes: sanitizedNotes
            });

            return favorite;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to add favorite', error);
        }
    }

    async removeFavorite(userId, courseId) {
        try {
            const favorite = await this.model.delete(userId, courseId);
            if (!favorite) {
                throw new ValidationError('Favorite not found');
            }
            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to remove favorite', error);
        }
    }

    async getUserFavorites(userId) {
        try {
            return await this.model.getUserFavorites(userId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch user favorites', error);
        }
    }

    async updateNotes(userId, courseId, notes) {
        try {
            const favorite = await this.model.findByUserAndCourse(userId, courseId);
            if (!favorite) {
                throw new ValidationError('Favorite not found');
            }

            const sanitizedNotes = sanitizeContent(notes);
            const updated = await this.model.update(favorite.id, { notes: sanitizedNotes });
            return updated;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to update favorite notes', error);
        }
    }

    async isFavorite(userId, courseId) {
        try {
            return await this.model.isFavorite(userId, courseId);
        } catch (error) {
            throw new DatabaseError('Failed to check favorite status', error);
        }
    }

    async getFavoriteStats(courseId) {
        try {
            const stats = await this.model.getFavoriteStats(courseId);
            return {
                total_favorites: parseInt(stats.total_favorites) || 0,
                with_notes: parseInt(stats.with_notes) || 0,
                enrolled_favorites: parseInt(stats.enrolled_favorites) || 0
            };
        } catch (error) {
            throw new DatabaseError('Failed to fetch favorite statistics', error);
        }
    }
}

export default new FavoriteService();