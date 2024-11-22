-- migrations/20241121_production_update.sql

BEGIN;

-- Add course_favorites table
CREATE TABLE IF NOT EXISTS course_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_favorites_user ON course_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_course_favorites_course ON course_favorites(course_id);

-- Update lessons table
ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown',
    ADD COLUMN IF NOT EXISTS content_preview TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add lesson versioning table
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

-- Add version tracking trigger
CREATE OR REPLACE FUNCTION track_lesson_versions()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.content <> NEW.content) THEN
        NEW.version = OLD.version + 1;
        NEW.last_edited_at = CURRENT_TIMESTAMP;
        
        INSERT INTO lesson_versions (
            lesson_id,
            content,
            content_format,
            version,
            created_by,
            change_description
        ) VALUES (
            NEW.id,
            NEW.content,
            NEW.content_format,
            NEW.version,
            NEW.last_edited_by,
            'Aggiornamento contenuto'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lessons_version_tracker ON lessons;

CREATE TRIGGER lessons_version_tracker
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION track_lesson_versions();

COMMIT;