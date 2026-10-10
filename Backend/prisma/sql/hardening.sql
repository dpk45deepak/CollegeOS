-- Idempotent DB hardening that Prisma's schema language cannot express.
-- Applied after `prisma migrate deploy` (see package.json -> db:harden, docker-compose entrypoint).

CREATE EXTENSION IF NOT EXISTS vector;

-- 1) Keyword search: make contentTsv a GENERATED column + GIN index (hybrid retrieval)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = '"DocumentChunk"'::regclass AND attname = 'contentTsv' AND attgenerated = 's'
  ) THEN
    ALTER TABLE "DocumentChunk" DROP COLUMN IF EXISTS "contentTsv";
    ALTER TABLE "DocumentChunk"
      ADD COLUMN "contentTsv" tsvector GENERATED ALWAYS AS (to_tsvector('english', "content")) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "DocumentChunk_contentTsv_gin" ON "DocumentChunk" USING GIN ("contentTsv");

-- 2) Vector search: HNSW cosine index
CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_hnsw"
  ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);

-- 3) AuditLog is append-only: reject UPDATE / DELETE / TRUNCATE at the database level
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update_delete ON "AuditLog";
CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

DROP TRIGGER IF EXISTS audit_log_no_truncate ON "AuditLog";
CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();
