-- Drop the broken search_vector column and index
DROP INDEX IF EXISTS "idx_images_search_vector";
ALTER TABLE "Images" DROP COLUMN IF EXISTS search_vector;

-- Recreate the working combined FTS index
CREATE INDEX "idx_images_fts_combined" ON "Images" USING GIN(
  (
    setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C')
  )
);
