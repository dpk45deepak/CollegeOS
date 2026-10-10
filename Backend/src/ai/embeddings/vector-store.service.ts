import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const toVectorLiteral = (v: number[]) => `[${v.join(',')}]`;

@Injectable()
export class VectorStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async setEmbeddings(rows: { id: string; vector: number[]; model: string }[]): Promise<void> {
    if (!rows.length) return;
    await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.$executeRaw(
          Prisma.sql`UPDATE "DocumentChunk" SET "embedding" = ${toVectorLiteral(r.vector)}::vector, "embeddingModel" = ${r.model} WHERE "id" = ${r.id}`,
        ),
      ),
    );
  }
  /** Number of chunks of a document still waiting for an embedding. */
  async pending(documentId: string): Promise<number> {
    const r = await this.prisma.$queryRaw<{ n: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS n FROM "DocumentChunk" WHERE "documentId" = ${documentId} AND "embedding" IS NULL`,
    );
    return Number(r[0]?.n ?? 0);
  }
}
