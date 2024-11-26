-- migrations/20241126_add_indexes.sql
-- Rimuovo CONCURRENTLY per l'ambiente di test/development
CREATE INDEX IF NOT EXISTS idx_courses_id_asc ON courses(id ASC);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_course_created ON lessons(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON course_enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);