-- Full-text search: generated tsvector + GIN index.
-- Run after `prisma migrate dev` creates the base tables, or include in your first migration.
ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("content", '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "Article_searchVector_idx"
  ON "Article" USING GIN ("searchVector");
