-- migrations/20241126_add_indexes_prod.sql
DO $$
BEGIN
    PERFORM create_index_if_not_exists('idx_courses_id_asc', 'courses', 'id ASC', true);
    PERFORM create_index_if_not_exists('idx_courses_created_at', 'courses', 'created_at DESC', true);
    PERFORM create_index_if_not_exists('idx_lessons_course_created', 'lessons', '(course_id, created_at DESC)', true);
    PERFORM create_index_if_not_exists('idx_enrollments_user_course', 'course_enrollments', '(user_id, course_id)', true);
    PERFORM create_index_if_not_exists('idx_lesson_progress_user_lesson', 'lesson_progress', '(user_id, lesson_id)', true);
END $$;

-- Funzione di utilità per creare indici in modo sicuro
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    idx_name text,
    table_name text,
    column_def text,
    concurrent boolean DEFAULT false
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = idx_name
        AND n.nspname = current_schema()
    ) THEN
        IF concurrent THEN
            EXECUTE format('CREATE INDEX CONCURRENTLY %I ON %I %s',
                idx_name, table_name, column_def);
        ELSE
            EXECUTE format('CREATE INDEX %I ON %I %s',
                idx_name, table_name, column_def);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;