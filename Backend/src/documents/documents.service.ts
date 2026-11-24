import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentVisibility, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import { isAdmin } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES } from '../queue/queue.constants';
import { StorageService } from '../storage/storage.service';
import { ProcessJob } from '../ai/document-processing/document-processor';
import * as D from './dto/documents.dto';
import { canViewDocument, visibilityGrant } from './visibility';

/** Prisma filter equivalent of canViewDocument — used for list endpoints. */
export function documentWhere(p: Principal, collegeId: string): Prisma.DocumentWhereInput {
  const g = visibilityGrant(p);
  if (g.all) return { collegeId };
  return {
    collegeId,
    OR: [
      { uploadedById: p.userId },
      {
        visibility: {
          in: g.visibilities.filter((v) => v !== 'DEPARTMENT' && v !== 'ROLE_RESTRICTED' && v !== 'ADMIN_ONLY'),
        },
      },
      { visibility: 'DEPARTMENT', departmentId: { in: g.departmentIds } },
      { visibility: 'ROLE_RESTRICTED', allowedRoleKeys: { hasSome: g.roleKeys } },
    ],
  };
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly own: OwnershipService,
    @InjectQueue(QUEUES.DOCUMENT_PROCESSING) private readonly queue: Queue<ProcessJob>,
  ) {}

  private validateVisibility(p: Principal, v: DocumentVisibility, departmentId?: string | null, roles?: string[]) {
    if (v === 'DEPARTMENT' && !departmentId)
      throw new BadRequestException('departmentId is required for DEPARTMENT visibility');
    if (v === 'ROLE_RESTRICTED' && !roles?.length)
      throw new BadRequestException('allowedRoleKeys is required for ROLE_RESTRICTED visibility');
    if (roles?.some((r) => !Object.values(ROLE).includes(r as never)))
      throw new BadRequestException('Unknown role key');
    // Non-admins can only publish into their own department.
    if (!isAdmin(p) && departmentId && !p.departmentIds.includes(departmentId))
      throw new ForbiddenException('Not your department');
    if (!isAdmin(p) && v === 'ADMIN_ONLY') return; // allowed: most restrictive
  }

  async upload(p: Principal, c: string, file: { buffer: Buffer; originalname: string }, dto: D.UploadDocumentDto) {
    const visibility = dto.visibility ?? 'ADMIN_ONLY';
    this.validateVisibility(p, visibility, dto.departmentId, dto.allowedRoleKeys);
    await this.own.assert('department', dto.departmentId, c);
    await this.own.assert('subject', dto.subjectId, c);
    const stored = await this.storage.upload({
      collegeId: c,
      ownerId: p.userId,
      scope: 'documents',
      file: file.buffer,
      originalName: file.originalname,
      allowedExts: ['pdf', 'docx', 'txt'],
    });
    const doc = await this.prisma.document.create({
      data: {
        collegeId: c,
        uploadedById: p.userId,
        title: dto.title,
        documentType: dto.documentType,
        visibility,
        departmentId: dto.departmentId,
        allowedRoleKeys: dto.allowedRoleKeys ?? [],
        academicYear: dto.academicYear,
        semesterNumber: dto.semesterNumber,
        subjectId: dto.subjectId,
        storageKey: stored.key,
        mimeType: stored.mime,
        sizeBytes: stored.sizeBytes,
        checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
      },
    });
    try {
      await this.queue.add('process', { documentId: doc.id });
    } catch {
      // Offline queue fallback; document is safely stored in database
    }
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'DOCUMENT_UPLOAD',
      entity: 'Document',
      entityId: doc.id,
      newValue: { title: doc.title, visibility },
    });
    return doc;
  }

  async list(p: Principal, c: string, q: D.DocumentQueryDto) {
    const where: Prisma.DocumentWhereInput = {
      AND: [
        documentWhere(p, c),
        {
          documentType: q.documentType,
          status: q.status,
          ...(q.search ? { title: { contains: q.search, mode: 'insensitive' } } : {}),
        },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(q),
        select: {
          id: true,
          title: true,
          documentType: true,
          visibility: true,
          academicYear: true,
          status: true,
          pageCount: true,
          createdAt: true,
          departmentId: true,
        },
      }),
      this.prisma.document.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  /** 404 (not 403) for documents the caller may not see: existence is not disclosed. */
  private async visible(p: Principal, c: string, id: string) {
    const d = await this.prisma.document.findFirst({ where: { id, collegeId: c } });
    if (!d || !canViewDocument(p, d)) throw new NotFoundException('Document not found');
    return d;
  }
  async get(p: Principal, c: string, id: string) {
    const { storageKey: _k, checksumSha256: _s, ...rest } = await this.visible(p, c, id);
    return rest;
  }
  async download(p: Principal, c: string, id: string) {
    const d = await this.visible(p, c, id);
    return {
      buffer: await this.storage.read(d.storageKey),
      mime: d.mimeType,
      filename: `${d.title.replace(/[^\w.\- ]+/g, '_')}.${d.mimeType === 'application/pdf' ? 'pdf' : d.mimeType.includes('word') ? 'docx' : 'txt'}`,
    };
  }

  /** Visibility changes are propagated to every chunk in the same transaction — chunk metadata is what RAG filters on. */
  async updateVisibility(p: Principal, c: string, id: string, dto: D.UpdateVisibilityDto) {
    const d = await this.prisma.document.findFirst({ where: { id, collegeId: c } });
    if (!d) throw new NotFoundException();
    if (!isAdmin(p) && d.uploadedById !== p.userId)
      throw new ForbiddenException('Only the uploader or an admin can change visibility');
    this.validateVisibility(
      p,
      dto.visibility,
      dto.departmentId ?? d.departmentId,
      dto.allowedRoleKeys ?? d.allowedRoleKeys,
    );
    const data = {
      visibility: dto.visibility,
      departmentId: dto.departmentId ?? d.departmentId,
      allowedRoleKeys: dto.allowedRoleKeys ?? d.allowedRoleKeys,
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.document.update({ where: { id }, data });
      await tx.documentChunk.updateMany({ where: { documentId: id }, data });
      await this.audit.log(
        {
          collegeId: c,
          userId: p.userId,
          action: 'DOCUMENT_VISIBILITY',
          entity: 'Document',
          entityId: id,
          oldValue: { visibility: d.visibility, departmentId: d.departmentId, allowedRoleKeys: d.allowedRoleKeys },
          newValue: data,
        },
        tx,
      );
    });
    return { id, ...data };
  }

  async reprocess(p: Principal, c: string, id: string) {
    const d = await this.prisma.document.findFirst({ where: { id, collegeId: c } });
    if (!d) throw new NotFoundException();
    if (!isAdmin(p) && d.uploadedById !== p.userId)
      throw new ForbiddenException('Only the uploader or an admin can reprocess this document');

    await this.prisma.document.update({ where: { id }, data: { status: 'UPLOADED', failureReason: null } });
    try {
      await this.queue.add('process', { documentId: id });
    } catch (err) {
      await this.prisma.document.update({
        where: { id },
        data: { status: 'FAILED', failureReason: 'Processing queue unavailable. Please try again later.' },
      });
      throw new BadRequestException('Document processing queue is currently offline');
    }
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'DOCUMENT_REPROCESS',
      entity: 'Document',
      entityId: id,
    });
    return { queued: true };
  }

  async remove(p: Principal, c: string, id: string) {
    const d = await this.prisma.document.findFirst({ where: { id, collegeId: c } });
    if (!d) throw new NotFoundException();
    if (!isAdmin(p) && d.uploadedById !== p.userId)
      throw new ForbiddenException('Only the uploader or an admin can delete');
    await this.prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id } }); // chunks cascade
      await this.audit.log(
        {
          collegeId: c,
          userId: p.userId,
          action: 'DOCUMENT_DELETE',
          entity: 'Document',
          entityId: id,
          oldValue: { title: d.title, visibility: d.visibility },
        },
        tx,
      );
    });
    await this.storage.remove(d.storageKey);
  }
}
