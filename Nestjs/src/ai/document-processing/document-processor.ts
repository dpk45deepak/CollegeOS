import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job, Queue } from 'bullmq';
import { DomainEvents } from '../../common/events';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '../../queue/queue.constants';
import { StorageService } from '../../storage/storage.service';
import { AiClient } from '../ai-client.service';
import { VectorStoreService } from '../embeddings/vector-store.service';
import { chunkPages } from './chunker';
import { extractPages } from './extractors';
import { cleanPages, extractMetadata } from './text-cleaner';

const EMBED_BATCH = 32;
export interface ProcessJob {
  documentId: string;
}
export interface EmbedJob {
  documentId: string;
  chunkIds: string[];
}

/** Stage 1: extract → clean → metadata → chunk → persist chunks, then fan out embedding batches. */
@Processor(QUEUES.DOCUMENT_PROCESSING)
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: AiClient,
    private readonly vectors: VectorStoreService,
    private readonly events: EventEmitter2,
    @InjectQueue(QUEUES.EMBEDDING) private readonly embedQueue: Queue<EmbedJob>,
  ) {
    super();
  }

  async process(job: Job<ProcessJob>): Promise<void> {
    const doc = await this.prisma.document.findUnique({ where: { id: job.data.documentId } });
    if (!doc) return;
    await this.prisma.document.update({ where: { id: doc.id }, data: { status: 'PROCESSING', failureReason: null } });

    const buf = await this.storage.read(doc.storageKey);
    const { pages, pageCount } = await extractPages(buf, doc.mimeType);
    const cleaned = cleanPages(pages);
    if (!cleaned.length) throw new Error('No extractable text (scanned image PDF? OCR is not enabled)');
    const meta = extractMetadata(cleaned.map((p) => p.text).join('\n'));
    const academicYear = doc.academicYear ?? meta.academicYear ?? null;
    const chunks = chunkPages(cleaned);

    await this.prisma.$transaction([
      this.prisma.documentChunk.deleteMany({ where: { documentId: doc.id } }),
      this.prisma.documentChunk.createMany({
        data: chunks.map((c) => ({
          documentId: doc.id,
          collegeId: doc.collegeId,
          departmentId: doc.departmentId,
          documentType: doc.documentType,
          academicYear,
          semesterNumber: doc.semesterNumber,
          subjectId: doc.subjectId,
          visibility: doc.visibility,
          allowedRoleKeys: doc.allowedRoleKeys,
          chunkIndex: c.index,
          pageNumber: c.pageNumber,
          content: c.content,
          tokenCount: c.tokenCount,
        })),
      }),
      this.prisma.document.update({ where: { id: doc.id }, data: { pageCount, academicYear } }),
    ]);

    if (!this.ai.isConfigured()) {
      // Keyword (full-text) retrieval still works without embeddings.
      this.logger.warn(`AI provider not configured — document ${doc.id} indexed for keyword search only`);
      await this.markReady(doc.id, doc.collegeId);
      return;
    }
    const ids = (
      await this.prisma.documentChunk.findMany({
        where: { documentId: doc.id },
        select: { id: true },
        orderBy: { chunkIndex: 'asc' },
      })
    ).map((c) => c.id);
    for (let i = 0; i < ids.length; i += EMBED_BATCH)
      await this.embedQueue.add('embed', { documentId: doc.id, chunkIds: ids.slice(i, i + EMBED_BATCH) });
  }

  async markReady(documentId: string, collegeId: string) {
    await this.prisma.document.update({ where: { id: documentId }, data: { status: 'READY' } });
    this.events.emit(DomainEvents.DocumentReady, { collegeId, documentId });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProcessJob> | undefined, err: Error) {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.prisma.document
        .update({
          where: { id: job.data.documentId },
          data: { status: 'FAILED', failureReason: err.message.slice(0, 300) },
        })
        .catch(() => undefined);
    }
  }
}

/** Stage 2: embed chunk batches; the batch that finishes the last chunk flips the document to READY. */
@Processor(QUEUES.EMBEDDING, { concurrency: 3 })
export class EmbeddingProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClient,
    private readonly vectors: VectorStoreService,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<EmbedJob>): Promise<void> {
    const chunks = await this.prisma.documentChunk.findMany({
      where: { id: { in: job.data.chunkIds } },
      select: { id: true, content: true, collegeId: true },
    });
    if (!chunks.length) return;
    const res = await this.ai.embed(
      { collegeId: chunks[0].collegeId, userId: 'system' },
      chunks.map((c) => c.content),
    );
    await this.vectors.setEmbeddings(chunks.map((c, i) => ({ id: c.id, vector: res.vectors[i], model: res.model })));
    if ((await this.vectors.pending(job.data.documentId)) === 0) {
      await this.prisma.document.updateMany({
        where: { id: job.data.documentId, status: 'PROCESSING' },
        data: { status: 'READY' },
      });
      this.events.emit(DomainEvents.DocumentReady, { collegeId: chunks[0].collegeId, documentId: job.data.documentId });
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmbedJob> | undefined, err: Error) {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.prisma.document
        .update({
          where: { id: job.data.documentId },
          data: { status: 'FAILED', failureReason: `Embedding failed: ${err.message}`.slice(0, 300) },
        })
        .catch(() => undefined);
    }
  }
}
