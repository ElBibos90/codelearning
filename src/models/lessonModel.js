import { pool } from '../config/database.js';

export const lessonModel = {
    name: 'lesson',

    async create(lessonData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO lessons (
                    course_id,
                    title,
                    content,
                    content_format,
                    meta_description,
                    estimated_minutes,
                    order_number,
                    status,
                    last_edited_by,
                    version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
                RETURNING *
            `, [
                lessonData.courseId,
                lessonData.title,
                lessonData.content,
                lessonData.contentFormat || 'markdown',
                lessonData.metaDescription,
                lessonData.estimatedMinutes || 30,
                lessonData.orderNumber,
                lessonData.status || 'draft',
                lessonData.authorId
            ]);

            // Crea prima versione
            await client.query(`
                INSERT INTO lesson_versions (
                    lesson_id,
                    content,
                    content_format,
                    version,
                    created_by,
                    change_description
                ) VALUES ($1, $2, $3, 1, $4, 'Initial version')
            `, [
                result.rows[0].id,
                lessonData.content,
                lessonData.contentFormat || 'markdown',
                lessonData.authorId
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async update(lessonId, updateData, editorId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updates = [];
            const values = [];
            let paramCount = 1;

            const updateableFields = [
                'title', 'content', 'content_format', 
                'meta_description', 'estimated_minutes',
                'order_number', 'status'
            ];

            updateableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updates.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                    paramCount++;
                }
            });

            updates.push(`version = version + 1`);
            updates.push(`last_edited_at = CURRENT_TIMESTAMP`);
            updates.push(`last_edited_by = $${paramCount}`);
            values.push(editorId);
            values.push(lessonId);

            const result = await client.query(`
                UPDATE lessons 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount + 1}
                RETURNING *
            `, values);

            if (updateData.content) {
                await client.query(`
                    INSERT INTO lesson_versions (
                        lesson_id,
                        content,
                        content_format,
                        version,
                        created_by,
                        change_description
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    lessonId,
                    updateData.content,
                    updateData.content_format || result.rows[0].content_format,
                    result.rows[0].version,
                    editorId,
                    updateData.changeDescription || 'Content updated'
                ]);
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async getVersions(lessonId) {
        const result = await pool.query(`
            SELECT 
                lv.*,
                u.name as editor_name
            FROM lesson_versions lv
            LEFT JOIN users u ON u.id = lv.created_by
            WHERE lv.lesson_id = $1
            ORDER BY lv.version DESC
        `, [lessonId]);

        return result.rows;
    },

    async revertToVersion(lessonId, versionNumber, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const version = await client.query(`
                SELECT * FROM lesson_versions
                WHERE lesson_id = $1 AND version = $2
            `, [lessonId, versionNumber]);

            if (version.rows.length === 0) {
                throw new Error('Version not found');
            }

            const result = await client.query(`
                UPDATE lessons
                SET 
                    content = $1,
                    content_format = $2,
                    version = version + 1,
                    last_edited_at = CURRENT_TIMESTAMP,
                    last_edited_by = $3
                WHERE id = $4
                RETURNING *
            `, [
                version.rows[0].content,
                version.rows[0].content_format,
                userId,
                lessonId
            ]);

            await client.query(`
                INSERT INTO lesson_versions (
                    lesson_id,
                    content,
                    content_format,
                    version,
                    created_by,
                    change_description
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                lessonId,
                version.rows[0].content,
                version.rows[0].content_format,
                result.rows[0].version,
                userId,
                `Reverted to version ${versionNumber}`
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    async updateProgress(lessonId, userId, completed = true) {
        try {
            // Prima verifica che la lezione esista
            const lessonExists = await pool.query(
                'SELECT id FROM lessons WHERE id = $1',
                [lessonId]
            );
            
            if (lessonExists.rowCount === 0) {
                throw new Error('Lesson not found');
            }
    
            const result = await pool.query(`
                INSERT INTO lesson_progress (
                    lesson_id,
                    user_id,
                    completed,
                    completed_at,
                    last_accessed
                )
                VALUES ($1, $2, $3, CASE WHEN $3 THEN CURRENT_TIMESTAMP END, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, lesson_id)
                DO UPDATE SET
                    completed = $3,
                    completed_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP END,
                    last_accessed = CURRENT_TIMESTAMP
                RETURNING *
            `, [lessonId, userId, completed]);
    
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },
    
    async getProgress(lessonId, userId) {
        try {
            const result = await pool.query(`
                SELECT *
                FROM lesson_progress
                WHERE lesson_id = $1 AND user_id = $2
            `, [lessonId, userId]);
    
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    },
    
    async addResource(lessonId, resourceData) {
        try {
            const result = await pool.query(`
                INSERT INTO lesson_resources (
                    lesson_id,
                    title,
                    url,
                    description,
                    type
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [
                lessonId,
                resourceData.title,
                resourceData.url,
                resourceData.description,
                resourceData.type
            ]);
    
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },
    
    async getResources(lessonId) {
        try {
            const result = await pool.query(`
                SELECT *
                FROM lesson_resources
                WHERE lesson_id = $1
                ORDER BY created_at DESC
            `, [lessonId]);
    
            return result.rows;
        } catch (error) {
            throw error;
        }
    },
    
    async reorderLessons(courseId, orderUpdates) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const lessonIds = orderUpdates.map(u => u.lessonId);
            const existingLessons = await client.query(`
                SELECT id FROM lessons 
                WHERE id = ANY($1) AND course_id = $2
            `, [lessonIds, courseId]);
            
            if (existingLessons.rowCount !== lessonIds.length) {
                throw new Error('One or more lessons not found');
            }

            const updateValues = orderUpdates.map((u, i) => 
                `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
            ).join(',');
            
            const flatValues = orderUpdates.flatMap(u => 
                [u.lessonId, courseId, u.newOrder]
            );
            
            await client.query(`
                UPDATE lessons AS l SET
                    order_number = c.new_order
                FROM (VALUES ${updateValues}) AS c(lesson_id, course_id, new_order)
                WHERE l.id = c.lesson_id AND l.course_id = c.course_id
            `, flatValues);

            const result = await client.query(`
                SELECT id, order_number 
                FROM lessons 
                WHERE course_id = $1 
                ORDER BY order_number
            `, [courseId]);

            await client.query('COMMIT');
            return result.rows;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};