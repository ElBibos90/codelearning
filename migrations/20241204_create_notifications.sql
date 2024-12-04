-- Verifica ed eventuale creazione del type notification_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'notification_priority'
    ) THEN
        CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
    END IF;
END $$;

-- Crea la tabella notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority notification_priority DEFAULT 'normal',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (
        type IN ('system', 'course_update', 'lesson_completed', 'achievement', 'comment', 'enrollment')
    )
);

-- Aggiungi gli indici necessari
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Aggiungi la colonna notification_preferences alla tabella user_preferences se non esiste
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "system": true,
    "course_update": true,
    "lesson_completed": true,
    "achievement": true,
    "comment": true,
    "enrollment": true
}'::jsonb;

-- Aggiungi commenti alla tabella e alle colonne per documentazione
COMMENT ON TABLE notifications IS 'Store user notifications';
COMMENT ON COLUMN notifications.type IS 'Type of notification (system, course_update, etc.)';
COMMENT ON COLUMN notifications.priority IS 'Priority level of the notification';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data specific to notification type';