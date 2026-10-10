import { Injectable } from '@nestjs/common';
import { DocumentType, Prisma } from '@prisma/client';
import { Principal } from '../../common/types/principal';
import { VisibilityGrant, visibilityGrant } from '../../documents/visibility';
import { PrismaService } from '../../prisma/prisma.service';
import { AiClient } from '../ai-client.service';
import { toVectorLiteral } from '../embeddings/vector-store.service';
import { rrf } from './fusion';
import { Candidate, LexicalReranker, RERANKER, Ranked, Reranker, queryTerms } from './reranker';
import { Inject, Optional } from '@nestjs/common';

export interface RetrievalFilters {
  documentType?: DocumentType;
  academicYear?: string;
  semesterNumber?: number;
  subjectId?: string;
  departmentId?: string;
}
export interface RetrievalResult {
  chunks: Ranked[];
  usedVector: boolean;
  relevant: boolean;
}

export const MIN_RELEVANCE = 0.3;
const CANDIDATES = 30;
const CONTEXT_CHUNKS = 6;
const CONTEXT_CHARS = 9000;
const PER_DOC_CAP = 3;

/**
 * Permission + metadata predicate for the chunk table. This is evaluated INSIDE the vector and keyword queries,
 * so a chunk the caller may not read is never fetched, never reranked and never shown to the LLM.
 */
export function chunkFilterSql(collegeId: string, g: VisibilityGrant, f: RetrievalFilters = {}): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`c."collegeId" = ${collegeId}`, Prisma.sql`d."status" = 'READY'`];
  if (!g.all) {
    const plain = g.visibilities.filter((v) => v === 'PUBLIC' || v === 'STUDENTS' || v === 'TEACHERS' || v === 'STAFF');
    parts.push(Prisma.sql`(
      c."visibility"::text = ANY(${plain}::text[])
      OR (c."visibility" = 'DEPARTMENT' AND c."departmentId" = ANY(${g.departmentIds}::text[]))
      OR (c."visibility" = 'ROLE_RESTRICTED' AND c."allowedRoleKeys" && ${g.roleKeys}::text[])
    )`);
  }
  if (f.documentType) parts.push(Prisma.sql`c."documentType" = ${f.documentType}::"DocumentType"`);
  if (f.academicYear) parts.push(Prisma.sql`c."academicYear" = ${f.academicYear}`);
  if (f.semesterNumber)
    parts.push(Prisma.sql`(c."semesterNumber" IS NULL OR c."semesterNumber" = ${f.semesterNumber})`);
  if (f.subjectId) parts.push(Prisma.sql`(c."subjectId" IS NULL OR c."subjectId" = ${f.subjectId})`);
  if (f.departmentId) parts.push(Prisma.sql`(c."departmentId" IS NULL OR c."departmentId" = ${f.departmentId})`);
  return Prisma.join(parts, ' AND ');
}

type Row = {
  id: string;
  documentId: string;
  chunkIndex: number;
  title: string;
  documentType: string;
  academicYear: string | null;
  pageNumber: number | null;
  content: string;
  score: number;
};

@Injectable()
export class RetrievalService {
  private readonly reranker: Reranker;
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClient,
    @Optional() @Inject(RERANKER) reranker?: Reranker,
  ) {
    this.reranker = reranker ?? new LexicalReranker();
  }

  async retrieve(
    p: Pick<Principal, 'roleKeys' | 'departmentIds' | 'userId'>,
    collegeId: string,
    query: string,
    filters: RetrievalFilters = {},
  ): Promise<RetrievalResult> {
    const where = chunkFilterSql(collegeId, visibilityGrant(p), filters);
    const select = Prisma.sql`c."id", c."documentId", c."chunkIndex", d."title", c."documentType"::text AS "documentType", c."academicYear", c."pageNumber", c."content"`;

    // 1) keyword leg (OR semantics over sanitised terms → natural-language questions still match)
    const terms = queryTerms(query).slice(0, 12);
    const tsq = terms.map((t) => `${t}:*`).join(' | ');
    const keyword: Row[] = tsq
      ? await this.prisma.$queryRaw<Row[]>(Prisma.sql`
          SELECT ${select}, ts_rank_cd(c."contentTsv", q) AS score
          FROM "DocumentChunk" c JOIN "Document" d ON d."id" = c."documentId", to_tsquery('english', ${tsq}) q
          WHERE ${where} AND c."contentTsv" @@ q
          ORDER BY score DESC LIMIT ${CANDIDATES}`)
      : [];

    // 2) vector leg (skipped when no provider is configured)
    let vector: Row[] = [];
    let usedVector = false;
    if (this.ai.isConfigured()) {
      try {
        const emb = await this.ai.embed({ collegeId, userId: p.userId }, [query]);
        const lit = toVectorLiteral(emb.vectors[0]);
        vector = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
          SELECT ${select}, 1 - (c."embedding" <=> ${lit}::vector) AS score
          FROM "DocumentChunk" c JOIN "Document" d ON d."id" = c."documentId"
          WHERE ${where} AND c."embedding" IS NOT NULL
          ORDER BY c."embedding" <=> ${lit}::vector LIMIT ${CANDIDATES}`);
        usedVector = true;
      } catch {
        /* degrade gracefully to keyword-only */
      }
    }

    // 3) fuse + rerank
    const fused = rrf([vector.map((r) => r.id), keyword.map((r) => r.id)]);
    const byId = new Map<string, Candidate>();
    for (const r of [...keyword, ...vector]) {
      const prev = byId.get(r.id);
      byId.set(r.id, {
        id: r.id,
        documentId: r.documentId,
        chunkIndex: r.chunkIndex,
        title: r.title,
        documentType: r.documentType,
        academicYear: r.academicYear,
        pageNumber: r.pageNumber,
        content: r.content,
        fused: fused.get(r.id) ?? 0,
        vectorScore: prev?.vectorScore ?? (vector.includes(r) ? Number(r.score) : undefined),
      });
    }
    const ranked = await this.reranker.rerank(query, [...byId.values()]);

    // 4) context assembly under size limits, capped per document
    const perDoc = new Map<string, number>();
    const chunks: Ranked[] = [];
    let chars = 0;
    for (const c of ranked) {
      if (chunks.length >= CONTEXT_CHUNKS) break;
      if ((perDoc.get(c.documentId) ?? 0) >= PER_DOC_CAP) continue;
      if (chars + c.content.length > CONTEXT_CHARS && chunks.length > 0) continue;
      perDoc.set(c.documentId, (perDoc.get(c.documentId) ?? 0) + 1);
      chars += c.content.length;
      chunks.push(c);
    }
    return { chunks, usedVector, relevant: chunks.length > 0 && chunks[0].relevance >= MIN_RELEVANCE };
  }
}
