import { pool } from '../config/database.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { lessonTemplates } from '../constants/lessonTemplates.js';

export const lessonService = {
  async createLesson({
    courseId,
    title,
    content,
    contentFormat = 'markdown',
    metaDescription,
    estimatedMinutes,
    orderNumber,
    authorId,
    templateType = 'theory'
  }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Usa il template se il contenuto non è fornito
      const initialContent = content || lessonTemplates[templateType];
      
      // Sanitizza il contenuto se necessario
      const sanitizedContent = contentFormat === 'html' 
        ? sanitizeContent(initialContent)
        : initialContent;

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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, 1)
        RETURNING id, title, status
      `, [
        courseId,
        title,
        sanitizedContent,
        contentFormat,
        metaDescription,
        estimatedMinutes,
        orderNumber,
        authorId
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

  async updateLesson({
    lessonId,
    title,
    content,
    contentFormat,
    metaDescription,
    estimatedMinutes,
    editorId
  }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const sanitizedContent = contentFormat === 'html' 
        ? sanitizeContent(content)
        : content;

      const result = await client.query(`
        UPDATE lessons 
        SET 
          title = COALESCE($1, title),
          content = COALESCE($2, content),
          content_format = COALESCE($3, content_format),
          meta_description = COALESCE($4, meta_description),
          estimated_minutes = COALESCE($5, estimated_minutes),
          last_edited_by = $6,
          last_edited_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, title, version, status
      `, [
        title,
        sanitizedContent,
        contentFormat,
        metaDescription,
        estimatedMinutes,
        editorId,
        lessonId
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

  async changeStatus(lessonId, newStatus, userId) {
    const result = await pool.query(`
      UPDATE lessons
      SET 
        status = $1,
        published_at = CASE 
          WHEN $1 = 'published' THEN CURRENT_TIMESTAMP
          ELSE published_at
        END,
        last_edited_by = $2,
        last_edited_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, status, published_at
    `, [newStatus, userId, lessonId]);

    return result.rows[0];
  }
};