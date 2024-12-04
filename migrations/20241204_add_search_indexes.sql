-- Aggiungi colonne per la ricerca
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Crea funzione per aggiornare i vettori di ricerca dei corsi
CREATE OR REPLACE FUNCTION courses_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.difficulty_level, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea funzione per aggiornare i vettori di ricerca delle lezioni
CREATE OR REPLACE FUNCTION lessons_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.meta_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea i trigger per l'aggiornamento automatico
DROP TRIGGER IF EXISTS courses_search_update ON courses;
CREATE TRIGGER courses_search_update
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION courses_search_vector_update();

DROP TRIGGER IF EXISTS lessons_search_update ON lessons;
CREATE TRIGGER lessons_search_update
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION lessons_search_vector_update();

-- Crea indici GIN per ricerca veloce
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_lessons_search ON lessons USING GIN(search_vector);

-- Aggiorna i vettori di ricerca esistenti
UPDATE courses SET search_vector = 
  setweight(to_tsvector('italian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('italian', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('italian', COALESCE(difficulty_level, '')), 'C');

UPDATE lessons SET search_vector = 
  setweight(to_tsvector('italian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('italian', COALESCE(content, '')), 'B') ||
  setweight(to_tsvector('italian', COALESCE(meta_description, '')), 'C');