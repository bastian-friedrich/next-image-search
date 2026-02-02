-- Add GIN index for PostgreSQL full-text search on suchtext field
CREATE INDEX IF NOT EXISTS "idx_images_fts" ON "Images" USING GIN(to_tsvector('english', suchtext));