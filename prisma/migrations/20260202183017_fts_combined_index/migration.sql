-- Drop old single-field FTS index
DROP INDEX IF EXISTS "idx_images_fts";

-- Create combined FTS index with all searchable fields
CREATE INDEX "idx_images_fts_combined" ON "Images" USING GIN(
  (
    setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C')
  )
);