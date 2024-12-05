import { jest } from '@jest/globals';
import { pool } from '../../src/config/database.js';
import SearchService from '../../src/services/SearchService.js';
import { ValidationError } from '../../src/utils/errors';
import bcrypt from 'bcryptjs';

describe('SearchService', () => {
    let testCourse;
    let testLesson;

    beforeAll(async () => {
        try {
            // Creazione corso di test
            const courseResult = await pool.query(`
                INSERT INTO courses (
                    title, 
                    description, 
                    difficulty_level,
                    duration_hours
                ) VALUES (
                    'Test JavaScript Course',
                    'Learn JavaScript programming',
                    'beginner',
                    10
                ) RETURNING id, title
            `);
            testCourse = courseResult.rows[0];
            //console.log('Created test course:', testCourse);

            // Aggiornamento manuale del vettore di ricerca per il corso
            await pool.query(`
                UPDATE courses
                SET search_vector = 
                    setweight(to_tsvector('italian', title), 'A') ||
                    setweight(to_tsvector('italian', description), 'B') ||
                    setweight(to_tsvector('italian', difficulty_level), 'C')
                WHERE id = $1
            `, [testCourse.id]);

            // Creazione lezione di test
            const lessonResult = await pool.query(`
                INSERT INTO lessons (
                    course_id,
                    title,
                    content,
                    meta_description,
                    order_number
                ) VALUES (
                    $1,
                    'JavaScript Variables',
                    'Learn about JavaScript variables and data types',
                    'Understanding JavaScript variables',
                    1
                ) RETURNING id, title
            `, [testCourse.id]);
            testLesson = lessonResult.rows[0];
            //console.log('Created test lesson:', testLesson);

            // Aggiornamento manuale del vettore di ricerca per la lezione
            await pool.query(`
                UPDATE lessons
                SET search_vector = 
                    setweight(to_tsvector('italian', title), 'A') ||
                    setweight(to_tsvector('italian', content), 'B') ||
                    setweight(to_tsvector('italian', meta_description), 'C')
                WHERE id = $1
            `, [testLesson.id]);

            // Attendi per permettere l'aggiornamento
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        await pool.query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
        await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
        await pool.end();
    });

    describe('Course Search', () => {
        test('should find courses by title', async () => {
            const result = await SearchService.searchCourses('JavaScript');
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].title).toContain('JavaScript');
        });

        test('should filter by difficulty', async () => {
            const result = await SearchService.searchCourses('JavaScript', {
                difficulty: 'beginner'
            });
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].difficulty_level).toBe('beginner');
        });

        test('should validate search query', async () => {
            await expect(SearchService.searchCourses('')).rejects.toThrow(ValidationError);
        });
    });

    describe('Lesson Search', () => {
        test('should find lessons by title', async () => {
            const result = await SearchService.searchLessons('Variables');
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].title).toContain('Variables');
        });

        test('should find lessons by content', async () => {
            const result = await SearchService.searchLessons('data types');
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].content).toContain('data types');
        });

        test('should filter by course', async () => {
            const result = await SearchService.searchLessons('Variables', {
                courseId: testCourse.id
            });
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0].course_id).toBe(testCourse.id);
        });
    });

    describe('Global Search', () => {
        test('should search across courses and lessons', async () => {
            const result = await SearchService.search('JavaScript');
            expect(result.courses).toBeDefined();
            expect(result.lessons).toBeDefined();
            expect(result.totalResults).toBeGreaterThan(0);
        });
    });

    describe('Search Suggestions', () => {
        test('should get suggestions for courses', async () => {
            const suggestions = await SearchService.getSuggestions('JavaScript', 'courses');
            //console.log('Suggestions:', suggestions);
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeGreaterThan(0);
        });

        test('should get suggestions for all types', async () => {
            const suggestions = await SearchService.getSuggestions('Java');
            expect(Array.isArray(suggestions)).toBe(true);
            suggestions.forEach(suggestion => {
                expect(suggestion).toHaveProperty('type');
                expect(['course', 'lesson']).toContain(suggestion.type);
            });
        });      

        test('should handle short queries', async () => {
            const suggestions = await SearchService.getSuggestions('a');
            expect(suggestions).toEqual([]);
        });
    });
});