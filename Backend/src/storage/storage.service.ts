import { ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isAdmin } from '../access/access.service';
import { P, ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { AppConfigService } from '../config/app-config.service';
import { canViewDocument } from '../documents/visibility';
import { PrismaService } from '../prisma/prisma.service';
import { validateUpload } from './file-validation';
import { MALWARE_SCANNER, MalwareScanner, STORAGE_DRIVER, StorageDriver } from './storage.types';

export interface StoredFile {
  key: string;
  mime: string;
  sizeBytes: number;
  originalName: string;
}

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
    @Inject(MALWARE_SCANNER) private readonly scanner: MalwareScanner,
    private readonly config: AppConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  get maxBytes(): number {
    return this.config.get('MAX_UPLOAD_MB') * 1024 * 1024;
  }

  /** Validate (size + magic bytes) → malware scan → store. Keys are tenant- and owner-prefixed. */
  async upload(opts: {
    collegeId: string;
    ownerId: string;
    scope: string;
    file: Buffer;
    originalName: string;
    allowedExts: string[];
  }): Promise<StoredFile> {
    const detected = validateUpload(opts.file, opts.allowedExts, this.maxBytes);
    if (!(await this.scanner.isClean(opts.file, opts.originalName))) {
      throw new ForbiddenException({ message: 'File rejected by malware scan', errorCode: 'MALWARE_DETECTED' });
    }
    const key = `${opts.collegeId}/${opts.scope}/${opts.ownerId}/${randomUUID()}.${detected.ext}`;
    await this.driver.put(key, opts.file, detected.mime);
    return { key, mime: detected.mime, sizeBytes: opts.file.length, originalName: opts.originalName };
  }

  /** Store server-generated content (e.g. exported reports) — no user-upload validation needed. */
  putRaw(key: string, body: Buffer, contentType: string) {
    return this.driver.put(key, body, contentType);
  }
  read(key: string) {
    return this.driver.get(key);
  }
  remove(key: string) {
    return this.driver.delete(key);
  }

  /** A key may be referenced by a user only if it was uploaded into their tenant (and, for owner scopes, by them). */
  assertKeysBelong(keys: string[], collegeId: string, ownerId?: string): void {
    for (const k of keys) {
      const parts = k.split('/');
      if (parts[0] !== collegeId || k.includes('..') || (ownerId && parts[2] !== ownerId)) {
        throw new ForbiddenException({ message: 'Invalid file reference', errorCode: 'FILE_REF_DENIED' });
      }
    }
  }

  /**
   * Enforce object-level ACLs on /files/download so tenant users cannot download other users'
   * private documents, student submissions, complaints, or staff reports by guessing storage keys.
   */
  async authorizeDownload(p: Principal, collegeId: string, key: string): Promise<void> {
    this.assertKeysBelong([key], collegeId);
    if (isAdmin(p)) return;

    const parts = key.split('/');
    const scope = parts[1];
    const ownerId = parts[2];

    if (scope === 'reports') {
      if (!p.permissions.includes(P.REPORT_EXPORT)) {
        throw new ForbiddenException('Not authorized to download exported reports');
      }
      return;
    }

    if (!this.prisma) {
      if (ownerId !== p.userId) throw new ForbiddenException('Not authorized to download this file');
      return;
    }

    if (scope === 'documents') {
      const doc = await this.prisma.document.findFirst({
        where: { collegeId, storageKey: key },
        select: { visibility: true, departmentId: true, allowedRoleKeys: true, uploadedById: true },
      });
      if (doc) {
        if (!canViewDocument(p, doc)) {
          throw new ForbiddenException('Not authorized to download this document');
        }
        return;
      }
      if (ownerId !== p.userId) throw new ForbiddenException('Not authorized to download this document');
      return;
    }

    const [submission, assignment, notice] = await Promise.all([
      this.prisma.submission.findFirst({
        where: { fileKeys: { has: key }, assignment: { collegeId } },
        select: {
          studentId: true,
          assignment: {
            select: {
              createdById: true,
              subjectOffering: {
                select: { teacherId: true, subject: { select: { departmentId: true } } },
              },
            },
          },
        },
      }),
      this.prisma.assignment.findFirst({
        where: { collegeId, attachmentKeys: { has: key } },
        select: {
          createdById: true,
          subjectOffering: {
            select: { sectionId: true, teacherId: true, subject: { select: { departmentId: true } } },
          },
        },
      }),
      this.prisma.notice.findFirst({
        where: { collegeId, attachmentKeys: { has: key } },
        select: { authorId: true, departmentId: true, audienceRoles: true },
      }),
    ]);

    if (submission) {
      const deptId = submission.assignment.subjectOffering.subject.departmentId;
      const isOwner = p.studentId === submission.studentId;
      const isGuardian = p.guardianOfStudentIds.includes(submission.studentId);
      const isTeacher =
        submission.assignment.createdById === p.userId ||
        (!!p.teacherId && submission.assignment.subjectOffering.teacherId === p.teacherId);
      const isDeptHod = p.roleKeys.includes(ROLE.HOD) && p.departmentIds.includes(deptId);
      if (isOwner || isGuardian || isTeacher || isDeptHod) return;
      throw new ForbiddenException('Not authorized to download this submission attachment');
    }

    if (assignment) {
      const deptId = assignment.subjectOffering.subject.departmentId;
      const isTeacher =
        assignment.createdById === p.userId ||
        (!!p.teacherId && assignment.subjectOffering.teacherId === p.teacherId);
      const isDeptHod = p.roleKeys.includes(ROLE.HOD) && p.departmentIds.includes(deptId);
      const isStudentOrParent =
        (p.roleKeys.includes(ROLE.STUDENT) && !!p.studentId) || p.guardianOfStudentIds.length > 0;
      if (isTeacher || isDeptHod || isStudentOrParent) return;
      throw new ForbiddenException('Not authorized to download this assignment attachment');
    }

    if (notice) {
      if (notice.authorId === p.userId) return;
      const deptOk = !notice.departmentId || p.departmentIds.includes(notice.departmentId);
      const roleOk = notice.audienceRoles.length === 0 || notice.audienceRoles.some((r) => p.roleKeys.includes(r));
      if (deptOk && roleOk) return;
      throw new ForbiddenException('Not authorized to download this notice attachment');
    }

    // Unattached draft file: strictly limited to original uploader
    if (ownerId !== p.userId) {
      throw new ForbiddenException('Not authorized to download this file');
    }
  }
}
