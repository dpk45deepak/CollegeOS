# Retrieval-Augmented Generation (RAG)

College Knowledge AI answers institutional policy, ordinance, syllabus, and circular queries strictly from authorized documents indexed in PostgreSQL (`pgvector`). Live user data (attendance, timetable, grades, fees) is handled by permission-checked domain tools, not RAG.

## Document Ingestion Pipeline

1. **Upload & Malware Scan:** Authorized roles (`P.DOCUMENT_UPLOAD`) upload files via `POST /api/v1/documents`. `StorageService` validates MIME signatures and enforces `ProductionMalwareScanner` (`CLAMAV_URL`, fail-closed in production).
2. **Lifecycle States (`DocumentStatus`):** `UPLOADED` → `PROCESSING` → `READY` (or `FAILED` / `ARCHIVED`).
3. **Chunking & Embeddings:** Background workers extract text with page/section metadata, split overlapping chunks (`chunker.ts`), generate vector embeddings using the configured provider (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, or `local`), and persist `DocumentChunk` rows.
4. **Re-indexing:** Admins and library staff can monitor failed documents and re-trigger ingestion via `POST /api/v1/documents/:id/reprocess`.

## Retrieval & Access Pre-Filtering

- **Endpoints (`RagController`):**
  - `POST /api/v1/ai/knowledge/ask` (`AskDto`: `{ question, documentType?, academicYear?, semesterNumber? }`) → permission-filtered RAG answer with citations.
  - `POST /api/v1/ai/knowledge/search` (`AskDto`) → retrieval-only endpoint returning `{ relevant, usedVector, results: [{ chunkId, documentId, title, page, relevance, excerpt }] }` without LLM synthesis.
- **Tenant & Visibility Pre-Filtering (`visibility.ts`):**
  - Before chunks enter context, queries filter by `collegeId`, `status = READY`, optional filters (`documentType`, `academicYear`, `semesterNumber`), and `DocumentVisibility` (`PUBLIC`, `STUDENTS`, `TEACHERS`, `STAFF`, `DEPARTMENT`, `ADMIN_ONLY`).
  - Access control is enforced strictly in SQL/Prisma queries before any content is shown to the model.

## Grounding & Refusal Controls

- Hybrid retrieval combines vector similarity search (`pgvector`) with keyword fallback when vectors or external embeddings are unavailable (`usedVector` flag).
- System instructions treat retrieved text strictly as untrusted data and forbid inventing citations, document titles, or page numbers.
- If retrieval yields no sufficiently relevant authorized chunks (`relevant: false`), `RagAnswerService` refuses to guess and informs the caller that the institutional knowledge base lacks the requested rule.
