-- Drop the old complex index
DROP INDEX IF EXISTS "idx_images_fts_combined";

-- Add a generated column that stores the combined search vector
ALTER TABLE "Images" 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C')
) STORED;

-- Create GIN index on the generated column (much faster)
CREATE INDEX "idx_images_search_vector" ON "Images" USING GIN(search_vector);