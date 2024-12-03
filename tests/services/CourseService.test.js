// tests/services/CourseService.test.js
import { jest } from '@jest/globals';
import { CourseService } from '../../src/services/index.js';
import { pool } from '../../src/config/database.js';
import { userModel } from '../../src/models/userModel.js';

describe('CourseService', () => {
    let testUser;
    let testCourse;

    beforeAll(async () => {
        const tableCheck = await pool.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'courses'
        `);
        //console.log('Courses table structure:', tableCheck.rows);
        
        // Assicurati che la tabella courses abbia la struttura corretta
        await pool.query(`
            DO $$ 
            BEGIN
                -- Add columns if they don't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'courses' AND column_name = 'status'
                ) THEN
                    ALTER TABLE courses ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'courses' AND column_name = 'published_at'
                ) THEN
                    ALTER TABLE courses ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
                END IF;

                -- Update or create status constraint
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'courses_status_check'
                ) THEN
                    ALTER TABLE courses 
                    ADD CONSTRAINT courses_status_check 
                    CHECK (status IN ('draft', 'published', 'archived'));
                END IF;
            END $$;
        `);

        // Crea un utente di test
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', 'password123', 'user')
            RETURNING id, email, role
        `);
        testUser = userResult.rows[0];
    });

    beforeEach(async () => {
        // Pulisci le tabelle nell'ordine corretto
        await pool.query('TRUNCATE course_enrollments CASCADE');
        await pool.query('TRUNCATE lessons CASCADE');
        await pool.query('TRUNCATE courses CASCADE');

        // Crea un corso di test per ogni test
        const courseData = {
            title: 'Test Course',
            description: 'Test Description',
            difficulty_level: 'beginner',
            duration_hours: 10
        };

        const result = await pool.query(`
            INSERT INTO courses (title, description, difficulty_level, duration_hours, status)
            VALUES ($1, $2, $3, $4, 'draft')
            RETURNING *
        `, [courseData.title, courseData.description, courseData.difficulty_level, courseData.duration_hours]);
        
        testCourse = result.rows[0];
    });

    afterAll(async () => {
        // Pulizia finale del database
        await pool.query('TRUNCATE course_enrollments CASCADE');
        await pool.query('TRUNCATE lessons CASCADE');
        await pool.query('TRUNCATE courses CASCADE');
        await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
        await pool.end();
    });

    describe('Course Creation', () => {
        test('should create a new course', async () => {
            const courseData = {
                title: 'New Test Course',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 10
            };

            const course = await CourseService.create(courseData);
            expect(course).toBeDefined();
            expect(course.title).toBe(courseData.title);
            expect(course.difficulty_level).toBe(courseData.difficulty_level);
            expect(course.status).toBe('draft');
        });

        test('should fail with invalid difficulty level', async () => {
            const courseData = {
                title: 'Invalid Course',
                description: 'Test Description',
                difficulty_level: 'invalid',
                duration_hours: 10
            };

            await expect(CourseService.create(courseData))
                .rejects
                .toThrow('Course validation failed');
        });

        test('should fail with too short title', async () => {
            const courseData = {
                title: 'Te',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 10
            };

            await expect(CourseService.create(courseData))
                .rejects
                .toThrow('Course validation failed');
        });
    });
    describe('Course Retrieval', () => {
        test('should get course with lessons', async () => {
            // Crea una lezione per il corso di test
            await pool.query(`
                INSERT INTO lessons (course_id, title, content, order_number)
                VALUES ($1, 'Test Lesson', 'Test Content', 1)
            `, [testCourse.id]);

            const course = await CourseService.getWithLessons(testCourse.id);
            expect(course).toBeDefined();
            expect(course.lessons).toBeDefined();
            expect(Array.isArray(course.lessons)).toBe(true);
            expect(course.lessons.length).toBe(1);
        });

        test('should search courses', async () => {
            const result = await CourseService.search('Test');
            expect(result.courses).toBeDefined();
            expect(Array.isArray(result.courses)).toBe(true);
            expect(result.totalCount).toBeGreaterThan(0);
        });
    });

    describe('Course Publishing', () => {
        test('should publish course with lessons', async () => {
            // Aggiungi una lezione al corso
            await pool.query(`
                INSERT INTO lessons (course_id, title, content, order_number)
                VALUES ($1, 'Test Lesson', 'Test Content', 1)
            `, [testCourse.id]);
        
            // Debug log
            //console.log('Test course before publish:', testCourse);
        
            // Verifica il conteggio delle lezioni
            const lessonsResult = await pool.query(
                'SELECT COUNT(*) FROM lessons WHERE course_id = $1',
                [testCourse.id]
            );
            //console.log('Lessons count:', lessonsResult.rows[0].count);
        
            // Prova a pubblicare il corso
            const publishedCourse = await CourseService.publish(testCourse.id);
            
            // Verifica i risultati
            expect(publishedCourse).toBeDefined();
            expect(publishedCourse.status).toBe('published');
            expect(publishedCourse.published_at).toBeDefined();
            
            // Debug log
            //console.log('Published course:', publishedCourse);
        });

        test('should fail publishing course without lessons', async () => {
            const newCourse = await CourseService.create({
                title: 'Course Without Lessons',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 10
            });

            await expect(CourseService.publish(newCourse.id))
                .rejects
                .toThrow('Cannot publish course without lessons');
        });
    });

    describe('Course Enrollment', () => {
        test('should enroll user in course', async () => {
            const enrollment = await CourseService.enrollUser(testCourse.id, testUser.id);
            expect(enrollment).toBeDefined();
            expect(enrollment.user_id).toBe(testUser.id);
            expect(enrollment.course_id).toBe(testCourse.id);
        });

        test('should prevent duplicate enrollment', async () => {
            // Prima iscrizione
            await CourseService.enrollUser(testCourse.id, testUser.id);
            
            // Seconda iscrizione dovrebbe fallire
            await expect(
                CourseService.enrollUser(testCourse.id, testUser.id)
            ).rejects.toThrow('User already enrolled in this course');
        });

        test('should get user progress', async () => {
            // Prima iscrivi l'utente
            await CourseService.enrollUser(testCourse.id, testUser.id);
            
            // Aggiungi una lezione
            await pool.query(`
                INSERT INTO lessons (course_id, title, content, order_number)
                VALUES ($1, 'Test Lesson', 'Test Content', 1)
            `, [testCourse.id]);

            const progress = await CourseService.getUserProgress(testCourse.id, testUser.id);
            expect(progress).toBeDefined();
            expect(progress.total_lessons).toBeDefined();
            expect(progress.completed_lessons).toBeDefined();
            expect(progress.progress_percentage).toBeDefined();
        });
    });

    describe('Course Statistics', () => {
        test('should get course statistics', async () => {
            // Prepara i dati per le statistiche
            await CourseService.enrollUser(testCourse.id, testUser.id);
            await pool.query(`
                INSERT INTO lessons (course_id, title, content, order_number)
                VALUES ($1, 'Test Lesson', 'Test Content', 1)
            `, [testCourse.id]);

            const stats = await CourseService.getCourseStats(testCourse.id);
            expect(stats).toBeDefined();
            expect(stats.total_enrollments).toBeDefined();
            expect(stats.total_lessons).toBeDefined();
            expect(stats.avg_completion_days).toBeDefined();
        });
    });
});