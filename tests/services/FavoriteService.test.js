import { jest } from '@jest/globals';
import { FavoriteService } from '../../src/services';
import { pool } from '../../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('FavoriteService', () => {
    let testUser;
    let testCourse;
    let testFavorite;

    beforeAll(async () => {
        try {
            // Pulizia iniziale
            await pool.query('DELETE FROM course_favorites');
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

            // Crea la tabella course_favorites se non esiste
            await pool.query(`
                CREATE TABLE IF NOT EXISTS course_favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    course_id INTEGER NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                    UNIQUE(user_id, course_id)
                );

                CREATE INDEX IF NOT EXISTS idx_course_favorites_user ON course_favorites(user_id);
                CREATE INDEX IF NOT EXISTS idx_course_favorites_course ON course_favorites(course_id);
            `);

            // Crea un corso di test
            const courseResult = await pool.query(`
                INSERT INTO courses (title, description, difficulty_level, duration_hours)
                VALUES ('Test Course', 'Test Description', 'beginner', 10)
                RETURNING id, title, description, difficulty_level
            `);
            testCourse = courseResult.rows[0];

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Pulizia database
            await pool.query('DELETE FROM course_favorites');
            await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        } catch (error) {
            console.error('Cleanup error:', error);
        } finally {
            await pool.end();
        }
    });

    describe('Favorite Management', () => {
        test('should add course to favorites', async () => {
            const favorite = await FavoriteService.addFavorite(
                testUser.id,
                testCourse.id,
                'Test note'
            );

            expect(favorite).toBeDefined();
            expect(favorite.user_id).toBe(testUser.id);
            expect(favorite.course_id).toBe(testCourse.id);
            expect(favorite.notes).toBe('Test note');
            testFavorite = favorite;
        });

        test('should prevent duplicate favorites', async () => {
            await expect(
                FavoriteService.addFavorite(testUser.id, testCourse.id)
            ).rejects.toThrow('Course already in favorites');
        });

        test('should get user favorites', async () => {
            const favorites = await FavoriteService.getUserFavorites(testUser.id);
            expect(Array.isArray(favorites)).toBe(true);
            expect(favorites.length).toBe(1);
            expect(favorites[0].course_title).toBe(testCourse.title);
        });

        test('should update favorite notes', async () => {
            const updatedNotes = 'Updated test note';
            const result = await FavoriteService.updateNotes(
                testUser.id,
                testCourse.id,
                updatedNotes
            );

            expect(result).toBeDefined();
            expect(result.notes).toBe(updatedNotes);
        });

        test('should check if course is favorite', async () => {
            const isFavorite = await FavoriteService.isFavorite(
                testUser.id,
                testCourse.id
            );
            expect(isFavorite).toBe(true);

            const isNotFavorite = await FavoriteService.isFavorite(
                testUser.id,
                testCourse.id + 1
            );
            expect(isNotFavorite).toBe(false);
        });
    });

    describe('Favorite Removal', () => {
        test('should remove from favorites', async () => {
            const result = await FavoriteService.removeFavorite(
                testUser.id,
                testCourse.id
            );
            expect(result).toBe(true);

            // Verify it's removed
            const isFavorite = await FavoriteService.isFavorite(
                testUser.id,
                testCourse.id
            );
            expect(isFavorite).toBe(false);
        });

        test('should fail removing non-existent favorite', async () => {
            await expect(
                FavoriteService.removeFavorite(testUser.id, testCourse.id)
            ).rejects.toThrow('Favorite not found');
        });
    });

    describe('Favorite Statistics', () => {
        test('should get course favorite stats', async () => {
            // Pulizia e setup
            await pool.query('DELETE FROM course_favorites');
            
            // Aggiungi un preferito con note
            await FavoriteService.addFavorite(testUser.id, testCourse.id, 'Test note');
    
            const stats = await FavoriteService.getFavoriteStats(testCourse.id);
            
            expect(stats).toBeDefined();
            expect(typeof stats.total_favorites).toBe('number');
            expect(typeof stats.with_notes).toBe('number');
            expect(typeof stats.enrolled_favorites).toBe('number');
            expect(stats.total_favorites).toBe(1);
            expect(stats.with_notes).toBe(1);
        });
    });

    describe('Validation', () => {
        test('should validate required fields', async () => {
            await expect(
                FavoriteService.create({})
            ).rejects.toThrow('Favorite validation failed');
        });

        test('should require courseId', async () => {
            await expect(
                FavoriteService.create({ 
                    userId: testUser.id
                })
            ).rejects.toThrow();
        });

        test('should require userId', async () => {
            await expect(
                FavoriteService.create({
                    courseId: testCourse.id
                })
            ).rejects.toThrow();
        });

        test('should sanitize notes', async () => {
            const timestamp = Date.now();
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            // Crea un nuovo utente per questo test
            const userResult = await pool.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ('Test User 2', $1, $2, 'user')
                RETURNING id
            `, [`test2.${timestamp}@example.com`, hashedPassword]);
    
            // Crea un nuovo corso per questo test
            const courseResult = await pool.query(`
                INSERT INTO courses (title, description, difficulty_level, duration_hours)
                VALUES ('Test Course 2', 'Test Description', 'beginner', 10)
                RETURNING id
            `);
            
            const favorite = await FavoriteService.addFavorite(
                userResult.rows[0].id,
                courseResult.rows[0].id,
                '<script>alert("xss")</script><p>Safe content</p>'
            );
    
            expect(favorite.notes).not.toContain('<script>');
            expect(favorite.notes).toContain('<p>Safe content</p>');
    
            // Pulizia
            await pool.query('DELETE FROM course_favorites WHERE id = $1', [favorite.id]);
            await pool.query('DELETE FROM courses WHERE id = $1', [courseResult.rows[0].id]);
            await pool.query('DELETE FROM users WHERE id = $1', [userResult.rows[0].id]);
        });
    });
});