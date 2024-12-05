import BaseService from './BaseService.js';
import { notificationModel } from '../models/notificationModel.js';
import { ValidationError, DatabaseError, AppError } from '../utils/errors/index.js';
import { sanitizeContent } from '../utils/sanitize.js';

class NotificationService extends BaseService {
    constructor() {
        super(notificationModel);
    }

    validate(data) {
        const errors = [];
        
        if (!data.user_id) {
            errors.push({
                field: 'user_id',
                message: 'User ID is required'
            });
        }

        if (!data.type) {
            errors.push({
                field: 'type',
                message: 'Notification type is required'
            });
        }

        if (!data.title || data.title.length < 3) {
            errors.push({
                field: 'title',
                message: 'Title must be at least 3 characters long'
            });
        }

        if (!data.message) {
            errors.push({
                field: 'message',
                message: 'Message is required'
            });
        }

        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        if (data.priority && !validPriorities.includes(data.priority)) {
            errors.push({
                field: 'priority',
                message: 'Invalid priority level'
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Notification validation failed', errors);
        }
    }

    async create(notificationData) {
        try {
            this.validate(notificationData);

            // Sanitizza il contenuto del messaggio
            notificationData.message = sanitizeContent(notificationData.message);
            
            // Verifica le preferenze dell'utente
            const preferences = await this.model.getUserPreferences(notificationData.user_id);
            if (!preferences?.notification_preferences?.[notificationData.type]) {
                return null; // L'utente ha disabilitato questo tipo di notifica
            }

            const notification = await this.model.create(notificationData);
            return notification;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to create notification', error);
        }
    }

    async getUserNotifications(userId, options = {}) {
        try {
            return await this.model.getUserNotifications(userId, options);
        } catch (error) {
            throw new DatabaseError('Failed to fetch notifications', error);
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await this.model.markAsRead(notificationId, userId);
            if (!notification) {
                throw new ValidationError('Notification not found');
            }
            return notification;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to mark notification as read', error);
        }
    }

    async markAllAsRead(userId) {
        try {
            return await this.model.markAllAsRead(userId);
        } catch (error) {
            throw new DatabaseError('Failed to mark notifications as read', error);
        }
    }

    async delete(notificationId, userId) {
        try {
            const result = await this.model.delete(notificationId, userId);
            if (!result) {
                throw new ValidationError('Notification not found');
            }
            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete notification', error);
        }
    }

    async deleteAllRead(userId) {
        try {
            return await this.model.deleteAllRead(userId);
        } catch (error) {
            throw new DatabaseError('Failed to delete read notifications', error);
        }
    }

    async getUnreadCount(userId) {
        try {
            return await this.model.getUnreadCount(userId);
        } catch (error) {
            throw new DatabaseError('Failed to get unread count', error);
        }
    }
}

export default new NotificationService();