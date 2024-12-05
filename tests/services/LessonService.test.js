import { jest } from '@jest/globals';
import { pool } from '../../src/config/database.js';
import LessonService from '../../src/services/LessonService.js';
import { ValidationError, DatabaseError } from '../../src/utils/errors/index.js';
import bcrypt from 'bcryptjs';

describe('LessonService', () => {
    let testUser;
    let testCourse;
    let testLesson;

    beforeAll(async () => {
        try {
            // Prima creiamo le tabelle necessarie
            await pool.query(`
                CREATE TABLE IF NOT EXISTS lesson_versions (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    content_format VARCHAR(10) DEFAULT 'markdown',
                    version INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER REFERENCES users(id),
                    change_description TEXT,
                    UNIQUE(lesson_id, version)
                );

                ALTER TABLE lessons
                ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
                ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown',
                ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id);
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS lesson_progress (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, lesson_id)
                );
            
                CREATE TABLE IF NOT EXISTS lesson_resources (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    url TEXT NOT NULL,
                    description TEXT,
                    type VARCHAR(20) CHECK (type IN ('pdf', 'link', 'code', 'github')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            // Pulizia database
            await pool.query('TRUNCATE users CASCADE');
            await pool.query('TRUNCATE courses CASCADE');
            await pool.query('TRUNCATE lessons CASCADE');
            await pool.query('TRUNCATE lesson_versions CASCADE');
            await pool.query('TRUNCATE lesson_progress CASCADE');
            await pool.query('TRUNCATE lesson_resources CASCADE');

            // Crea utente di test
            const hashedPassword = await bcrypt.hash('password123', 10);
            const userResult = await pool.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, role
            `, ['Test User', `test.${Date.now()}@example.com`, hashedPassword, 'admin']);
            testUser = userResult.rows[0];

            // Crea corso di test
            const courseResult = await pool.query(`
                INSERT INTO courses (title, description, difficulty_level, duration_hours)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, ['Test Course', 'Test Description', 'intermediate', 10]);
            testCourse = courseResult.rows[0];

            // Crea lezione di test
            const lessonData = {
                courseId: testCourse.id,
                title: 'Test Lesson',
                content: 'Test Content',
                contentFormat: 'markdown',
                orderNumber: 1,
                authorId: testUser.id
            };
            
            testLesson = await LessonService.create(lessonData);
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Lesson Creation', () => {
        test('should create lesson with template', async () => {
            const lessonData = {
                courseId: testCourse.id,
                title: 'Template Lesson',
                templateType: 'theory',
                orderNumber: 2,
                authorId: testUser.id
            };

            const lesson = await LessonService.create(lessonData);
            expect(lesson).toBeDefined();
            expect(lesson.title).toBe(lessonData.title);
            expect(lesson.content).toBeDefined();
            expect(lesson.version).toBe(1);
        });

        test('should fail with invalid data', async () => {
            const invalidData = {
                title: '',
                courseId: testCourse.id
            };

            await expect(LessonService.create(invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        test('should create lesson with custom content', async () => {
            const lessonData = {
                courseId: testCourse.id,
                title: 'Custom Lesson',
                content: '# Custom Content',
                contentFormat: 'markdown',
                orderNumber: 3,
                authorId: testUser.id
            };

            const lesson = await LessonService.create(lessonData);
            expect(lesson.content).toBe(lessonData.content);
        });
    });

    describe('Lesson Update and Versioning', () => {
        test('should update lesson and create new version', async () => {
            const updateData = {
                title: 'Updated Lesson',
                content: 'Updated content',
                changeDescription: 'Test update'
            };

            const updated = await LessonService.update(testLesson.id, updateData, testUser.id);
            
            expect(updated.title).toBe(updateData.title);
            expect(updated.content).toBe(updateData.content);
            expect(updated.version).toBe(2);
        });

        test('should get lesson versions', async () => {
            const versions = await LessonService.getVersions(testLesson.id);
            expect(versions).toBeInstanceOf(Array);
            expect(versions.length).toBeGreaterThanOrEqual(2);
            expect(versions[0].version).toBeGreaterThan(versions[1].version);
        });

        test('should revert to previous version', async () => {
            const reverted = await LessonService.revertToVersion(testLesson.id, 1, testUser.id);
            expect(reverted.version).toBe(3);
            const versions = await LessonService.getVersions(testLesson.id);
            expect(versions[0].change_description).toContain('Reverted to version');
        });
    });

    describe('Progress Tracking', () => {
        test('should mark lesson as completed', async () => {
            const progress = await LessonService.updateProgress(testLesson.id, testUser.id, true);
            expect(progress.completed).toBe(true);
            expect(progress.completed_at).toBeDefined();
        });

        test('should get progress status', async () => {
            const progress = await LessonService.getProgress(testLesson.id, testUser.id);
            expect(progress).toBeDefined();
            expect(progress.completed).toBe(true);
        });

        test('should update last accessed timestamp', async () => {
            const before = new Date().getTime();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await LessonService.updateProgress(testLesson.id, testUser.id, false);
            const progress = await LessonService.getProgress(testLesson.id, testUser.id);
            
            const progressTime = new Date(progress.last_accessed).getTime();
            expect(progressTime).toBeGreaterThan(before);
        }, 10000);
    });

    describe('Lesson Ordering', () => {
        test('should reorder lessons', async () => {
            // Prima pulisci tutte le lezioni esistenti
            await pool.query('DELETE FROM lessons WHERE course_id = $1', [testCourse.id]);
        
            // Crea la prima lezione
            const lesson1Result = await pool.query(`
                INSERT INTO lessons (
                    course_id, 
                    title, 
                    content, 
                    content_format, 
                    order_number, 
                    status,
                    version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, order_number
            `, [
                testCourse.id,
                'First Lesson',
                'First lesson content',
                'markdown',
                1,
                'draft',
                1
            ]);
        
            // Crea la seconda lezione
            const lesson2Result = await pool.query(`
                INSERT INTO lessons (
                    course_id, 
                    title, 
                    content, 
                    content_format, 
                    order_number, 
                    status,
                    version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, order_number
            `, [
                testCourse.id,
                'Second Lesson',
                'Second lesson content',
                'markdown',
                2,
                'draft',
                1
            ]);
            
            const lesson1 = lesson1Result.rows[0];
            const lesson2 = lesson2Result.rows[0];
        
            // Riordina le lezioni
            const orderUpdates = [
                { lessonId: lesson1.id, newOrder: 2 },
                { lessonId: lesson2.id, newOrder: 1 }
            ];
        
            const updatedOrder = await LessonService.reorderLessons(testCourse.id, orderUpdates);
        
            expect(updatedOrder).toHaveLength(2);
            expect(updatedOrder[0].id).toBe(lesson2.id);
            expect(updatedOrder[0].order_number).toBe(1);
            expect(updatedOrder[1].id).toBe(lesson1.id);
            expect(updatedOrder[1].order_number).toBe(2);
        });
    });

    describe('Content Sanitization', () => {
        test('should sanitize HTML content', async () => {
            const lessonData = {
                courseId: testCourse.id,
                title: 'HTML Lesson',
                content: '<p>Safe content</p><script>alert("unsafe")</script>',
                contentFormat: 'html',
                orderNumber: 10,
                authorId: testUser.id,
                status: 'draft'
            };
        
            const lesson = await LessonService.create(lessonData);
            expect(lesson.content).toContain('<p>Safe content</p>');
            expect(lesson.content).not.toContain('<script>');
        });

        test('should preserve markdown content', async () => {
            const markdownContent = '# Heading\n\n```js\nconst code = true;\n```';
            const lessonData = {
                courseId: testCourse.id,
                title: 'Markdown Lesson',
                content: markdownContent,
                contentFormat: 'markdown',
                orderNumber: 5,
                authorId: testUser.id
            };

            const lesson = await LessonService.create(lessonData);
            expect(lesson.content).toBe(markdownContent);
        });
    });

    afterAll(async () => {
        try {
            await pool.query('TRUNCATE users CASCADE');
            await pool.query('TRUNCATE courses CASCADE');
            await pool.query('TRUNCATE lessons CASCADE');
            await pool.query('TRUNCATE lesson_versions CASCADE');
            await pool.query('TRUNCATE lesson_progress CASCADE');
            await pool.query('TRUNCATE lesson_resources CASCADE');
        } catch (error) {
            console.error('Cleanup error:', error);
        } finally {
            await pool.end();
        }
    });
});