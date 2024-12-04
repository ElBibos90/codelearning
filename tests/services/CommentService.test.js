import { jest } from '@jest/globals';
import { CommentService } from '../../src/services';
import { pool } from '../../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('CommentService', () => {
    let testUser;
    let testCourse;
    let testLesson;
    let testComment;
    let testReply;

    beforeAll(async () => {
        try {
            // Pulizia iniziale - rimuoviamo il DELETE FROM comments
            await pool.query('DELETE FROM lesson_progress');
            await pool.query('DELETE FROM course_enrollments');
            await pool.query('DELETE FROM lessons');
            await pool.query('DELETE FROM courses');
            
            // Crea un utente di test con email univoca
            const timestamp = Date.now();
            const hashedPassword = await bcrypt.hash('password123', 10);
            const userResult = await pool.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ('Test User', $1, $2, 'user')
                RETURNING id, email, role
            `, [`test.${timestamp}@example.com`, hashedPassword]);
            testUser = userResult.rows[0];
    
            // Crea la tabella comments se non esiste
            await pool.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    parent_id INTEGER DEFAULT NULL,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
                );
    
                CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON comments(lesson_id);
                CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
                CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
            `);
    
            // Crea un corso di test
            const courseResult = await pool.query(`
                INSERT INTO courses (title, description, difficulty_level, duration_hours)
                VALUES ('Test Course', 'Test Description', 'beginner', 10)
                RETURNING id
            `);
            testCourse = courseResult.rows[0];
    
            // Crea una lezione di test
            const lessonResult = await pool.query(`
                INSERT INTO lessons (course_id, title, content, order_number)
                VALUES ($1, 'Test Lesson', 'Test Content', 1)
                RETURNING id
            `, [testCourse.id]);
            testLesson = lessonResult.rows[0];
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Pulizia database
            if (testLesson?.id) {
                await pool.query('DELETE FROM comments WHERE lesson_id = $1', [testLesson.id]);
                await pool.query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
            }
            if (testCourse?.id) {
                await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
            }
            if (testUser?.id) {
                await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        } finally {
            await pool.end();
        }
    });

    describe('Comment Creation', () => {
        test('should create a new comment', async () => {
            const commentData = {
                lessonId: testLesson.id,
                userId: testUser.id,
                content: 'Test comment content'
            };

            const comment = await CommentService.create(commentData);
            expect(comment).toBeDefined();
            expect(comment.content).toBe(commentData.content);
            expect(comment.user_id).toBe(testUser.id);
            expect(comment.lesson_id).toBe(testLesson.id);
            testComment = comment;
        });

        test('should fail with empty content', async () => {
            const commentData = {
                lessonId: testLesson.id,
                userId: testUser.id,
                content: ''
            };

            await expect(
                CommentService.create(commentData)
            ).rejects.toThrow('Comment validation failed');
        });

        test('should create a reply to a comment', async () => {
            const reply = await CommentService.reply(
                testComment.id,
                testUser.id,
                'Test reply content'
            );

            expect(reply).toBeDefined();
            expect(reply.parent_id).toBe(testComment.id);
            expect(reply.content).toBe('Test reply content');
            testReply = reply;
        });
    });

    describe('Comment Retrieval', () => {
        test('should get lesson comments', async () => {
            const comments = await CommentService.getLessonComments(testLesson.id);
            expect(Array.isArray(comments)).toBe(true);
            expect(comments.length).toBeGreaterThan(0);
            expect(comments[0].content).toBe(testComment.content);
        });

        test('should get user comments', async () => {
            const comments = await CommentService.getUserComments(testUser.id);
            expect(Array.isArray(comments)).toBe(true);
            expect(comments.length).toBeGreaterThan(0);
            expect(comments[0].user_id).toBe(testUser.id);
        });

        test('should get comment replies', async () => {
            const replies = await CommentService.getReplies(testComment.id);
            expect(Array.isArray(replies)).toBe(true);
            expect(replies.length).toBe(1);
            expect(replies[0].id).toBe(testReply.id);
        });
    });

    describe('Comment Update', () => {
        test('should update comment content', async () => {
            const updatedContent = 'Updated content';
            const result = await CommentService.update(
                testComment.id,
                testUser.id,
                { content: updatedContent }
            );

            expect(result).toBeDefined();
            expect(result.content).toBe(updatedContent);
        });

        test('should fail update with unauthorized user', async () => {
            const unauthorizedUserId = testUser.id + 1;
            await expect(
                CommentService.update(
                    testComment.id,
                    unauthorizedUserId,
                    { content: 'Unauthorized update' }
                )
            ).rejects.toThrow('Not authorized to update this comment');
        });
    });

    describe('Comment Deletion', () => {
        test('should soft delete a comment', async () => {
            const result = await CommentService.delete(testComment.id, testUser.id);
            expect(result).toBe(true);

            // Verify comment is not returned in queries
            const comments = await CommentService.getLessonComments(testLesson.id);
            expect(comments.find(c => c.id === testComment.id)).toBeUndefined();
        });

        test('should fail deletion with unauthorized user', async () => {
            const unauthorizedUserId = testUser.id + 1;
            await expect(
                CommentService.delete(testReply.id, unauthorizedUserId)
            ).rejects.toThrow('Not authorized to delete this comment');
        });
    });

    describe('Validation', () => {
        test('should validate required fields', async () => {
            await expect(
                CommentService.create({})
            ).rejects.toThrow('Comment validation failed');
        });

        test('should require lessonId', async () => {
            await expect(
                CommentService.create({ 
                    userId: testUser.id,
                    content: 'Test content'
                })
            ).rejects.toThrow();
        });

        test('should require userId', async () => {
            await expect(
                CommentService.create({
                    lessonId: testLesson.id,
                    content: 'Test content'
                })
            ).rejects.toThrow();
        });

        test('should sanitize content', async () => {
            const commentWithHTML = await CommentService.create({
                lessonId: testLesson.id,
                userId: testUser.id,
                content: '<script>alert("xss")</script><p>Safe content</p>'
            });

            expect(commentWithHTML.content).not.toContain('<script>');
            expect(commentWithHTML.content).toContain('<p>Safe content</p>');
        });
    });
});