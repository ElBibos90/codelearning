import { jest } from '@jest/globals';
import { EnrollmentService } from '../../src/services';
import { pool } from '../../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('EnrollmentService', () => {
    let testUser;
    let testCourse;
    let testEnrollment;

    beforeAll(async () => {
        // Crea un utente di test
        const hashedPassword = await bcrypt.hash('password123', 10);
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', $1, 'user')
            RETURNING id, email, role
        `, [hashedPassword]);
        testUser = userResult.rows[0];

        // Crea un corso di test
        const courseResult = await pool.query(`
            INSERT INTO courses (title, description, difficulty_level, duration_hours)
            VALUES ('Test Course', 'Test Description', 'beginner', 10)
            RETURNING id
        `);
        testCourse = courseResult.rows[0];
    });

    afterAll(async () => {
        // Pulizia database
        await pool.query('DELETE FROM course_enrollments');
        await pool.query('DELETE FROM lesson_progress');
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
        await pool.end();
    });

    describe('Enrollment Management', () => {
        test('should enroll user in course', async () => {
            const enrollment = await EnrollmentService.enroll(testUser.id, testCourse.id);
            expect(enrollment).toBeDefined();
            expect(enrollment.user_id).toBe(testUser.id);
            expect(enrollment.course_id).toBe(testCourse.id);
            testEnrollment = enrollment;
        });

        test('should prevent duplicate enrollment', async () => {
            await expect(
                EnrollmentService.enroll(testUser.id, testCourse.id)
            ).rejects.toThrow('User already enrolled in this course');
        });

        test('should get user enrollments', async () => {
            const enrollments = await EnrollmentService.getUserEnrollments(testUser.id);
            expect(Array.isArray(enrollments)).toBe(true);
            expect(enrollments.length).toBeGreaterThan(0);
            expect(enrollments[0].course_title).toBe('Test Course');
        });

        test('should get course enrollments', async () => {
            const enrollments = await EnrollmentService.getCourseEnrollments(testCourse.id);
            expect(Array.isArray(enrollments)).toBe(true);
            expect(enrollments.length).toBeGreaterThan(0);
            expect(enrollments[0].user_name).toBe('Test User');
        });
    });

    describe('Progress Tracking', () => {
        test('should complete course enrollment', async () => {
            const result = await EnrollmentService.completeCourse(testEnrollment.id);
            expect(result).toBeDefined();
            expect(result.completed).toBe(true);
            expect(result.completed_at).toBeDefined();
        });

        test('should get enrollment statistics', async () => {
            const stats = await EnrollmentService.getEnrollmentStats(testCourse.id);
            expect(stats).toBeDefined();
            expect(stats.total_enrollments).toBe('1');
            expect(stats.completed_enrollments).toBe('1');
            expect(stats.completion_rate).toBeDefined();
        });
    });

    describe('Enrollment Removal', () => {
        test('should unenroll user from course', async () => {
            const result = await EnrollmentService.unenroll(testUser.id, testCourse.id);
            expect(result).toBe(true);
        });

        test('should handle unenroll from non-existent enrollment', async () => {
            await expect(
                EnrollmentService.unenroll(testUser.id, testCourse.id)
            ).rejects.toThrow('Enrollment not found');
        });
    });

    describe('Validation', () => {
        test('should validate enrollment data', async () => {
            await expect(
                EnrollmentService.create({})
            ).rejects.toThrow('Enrollment validation failed');
        });

        test('should require userId', async () => {
            await expect(
                EnrollmentService.create({ courseId: 1 })
            ).rejects.toThrow();
        });

        test('should require courseId', async () => {
            await expect(
                EnrollmentService.create({ userId: 1 })
            ).rejects.toThrow();
        });
    });
});