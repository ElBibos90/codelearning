-- Up Migration
CREATE TABLE course_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_favorites_user ON course_favorites(user_id);
CREATE INDEX idx_course_favorites_course ON course_favorites(course_id);

-- Down Migration
DROP TABLE IF EXISTS course_favorites;