import BaseService from './BaseService.js';
import { enrollmentModel } from '../models/enrollmentModel.js';
import { ValidationError, DatabaseError } from '../utils/errors/index.js';

class EnrollmentService extends BaseService {
    constructor() {
        super(enrollmentModel);
    }
        async create(enrollmentData) {
                this.validate(enrollmentData);
                return await super.create(enrollmentData);
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
            throw new ValidationError('Enrollment validation failed', errors);
        }
    }

    async enroll(userId, courseId) {
        try {
            // Verifica se l'iscrizione esiste già
            const existing = await this.model.findByUserAndCourse(userId, courseId);
            if (existing) {
                throw new ValidationError('User already enrolled in this course');
            }

            const enrollment = await this.create({ userId, courseId });
            return enrollment;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to enroll in course', error);
        }
    }

    async getUserEnrollments(userId) {
        try {
            return await this.model.getUserEnrollments(userId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch user enrollments', error);
        }
    }

    async getCourseEnrollments(courseId) {
        try {
            return await this.model.getCourseEnrollments(courseId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch course enrollments', error);
        }
    }

    async completeCourse(enrollmentId) {
        try {
            const result = await this.model.updateProgress(enrollmentId, {
                completed: true,
                completed_at: new Date()
            });
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to complete course', error);
        }
    }

    async getEnrollmentStats(courseId) {
        try {
            return await this.model.getEnrollmentStats(courseId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch enrollment statistics', error);
        }
    }

    async unenroll(userId, courseId) {
        try {
            const enrollment = await this.model.findByUserAndCourse(userId, courseId);
            if (!enrollment) {
                throw new ValidationError('Enrollment not found');
            }

            await this.delete(enrollment.id);
            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError('Failed to unenroll from course', error);
        }
    }
}

export default new EnrollmentService();