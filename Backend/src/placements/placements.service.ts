import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobApplicationStatus, Prisma } from '@prisma/client';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import * as D from './dto/placements.dto';
import { MatchStudent, computeMatch } from './matching';

const NEXT: Record<JobApplicationStatus, JobApplicationStatus[]> = {
  APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

@Injectable()
export class PlacementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  createCompany(c: string, dto: D.CreateCompanyDto) {
    return this.prisma.company.create({ data: { ...dto, collegeId: c } });
  }
  listCompanies(c: string) {
    return this.prisma.company.findMany({ where: { collegeId: c }, orderBy: { name: 'asc' } });
  }

  async createJob(c: string, dto: D.CreateJobDto) {
    await this.own.assert('company', dto.companyId, c);
    await this.own.assert('department', dto.allowedDepartments, c);
    return this.prisma.job.create({
      data: {
        ...dto,
        requiredSkills: dto.requiredSkills.map((s) => s.trim().toLowerCase()),
        allowedDepartments: dto.allowedDepartments ?? [],
        collegeId: c,
      },
    });
  }
  async listJobs(c: string, q: D.JobQueryDto) {
    const where: Prisma.JobWhereInput = {
      collegeId: c,
      OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      ...(q.search ? { title: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { company: { select: { name: true } } },
        orderBy: { deadline: 'asc' },
        ...toSkipTake(q),
      }),
      this.prisma.job.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async createDrive(c: string, dto: D.CreateDriveDto, actorId: string) {
    await this.own.assert('job', dto.jobId, c);
    const job = await this.prisma.job.findUniqueOrThrow({ where: { id: dto.jobId }, include: { company: true } });
    const drive = await this.prisma.placementDrive.create({ data: { ...dto, collegeId: c } });
    const students = await this.prisma.student.findMany({
      where: {
        collegeId: c,
        ...(job.allowedDepartments.length ? { departmentId: { in: job.allowedDepartments } } : {}),
        ...(job.minCgpa ? { cgpa: { gte: job.minCgpa } } : {}),
      },
      select: { userId: true },
    });
    this.events.emit(DomainEvents.PlacementDriveCreated, { collegeId: c, driveId: drive.id });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: students.map((s) => s.userId),
      type: 'PlacementDriveCreated',
      title: `Placement drive: ${job.company.name}`,
      body: `${job.title} on ${dto.driveDate.toISOString().slice(0, 10)}${dto.venue ? ` at ${dto.venue}` : ''}.`,
      data: { driveId: drive.id, jobId: job.id },
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'DRIVE_CREATE',
      entity: 'PlacementDrive',
      entityId: drive.id,
    });
    return drive;
  }
  listDrives(c: string) {
    return this.prisma.placementDrive.findMany({
      where: { collegeId: c, driveDate: { gte: new Date() }, status: { not: 'CANCELLED' } },
      include: { job: { select: { title: true, company: { select: { name: true } } } } },
      orderBy: { driveDate: 'asc' },
    });
  }

  private async studentForMatching(c: string, studentId: string): Promise<MatchStudent> {
    const s = await this.prisma.student.findFirstOrThrow({
      where: { id: studentId, collegeId: c },
      include: { skills: true, portfolio: true },
    });
    const failingResults = await this.prisma.examResult.count({
      where: {
        studentId,
        collegeId: c,
        grade: { in: ['F', 'FAIL', 'AB'] },
      },
    });
    return {
      cgpa: s.cgpa === null ? null : Number(s.cgpa),
      departmentId: s.departmentId,
      skills: s.skills.map((x) => x.name),
      evidence: s.portfolio
        .filter((p) => p.type !== 'ACHIEVEMENT')
        .map((p) => ({ title: p.title, description: p.description, tags: p.tags })),
      backlogs: failingResults,
    };
  }

  /** Open jobs ranked by compatibility for the signed-in student (explainable). */
  async recommendations(p: Principal, c: string) {
    if (!p.studentId) throw new ForbiddenException('Students only');
    const student = await this.studentForMatching(c, p.studentId);
    const jobs = await this.prisma.job.findMany({
      where: { collegeId: c, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      include: { company: { select: { name: true } } },
    });
    return jobs
      .map((j) => ({
        job: j,
        match: computeMatch(student, {
          requiredSkills: j.requiredSkills,
          minCgpa: j.minCgpa === null ? null : Number(j.minCgpa),
          maxBacklogs: j.maxBacklogs,
          allowedDepartments: j.allowedDepartments,
        }),
      }))
      .sort((a, b) => Number(b.match.eligible) - Number(a.match.eligible) || b.match.score - a.match.score);
  }

  async apply(p: Principal, c: string, jobId: string) {
    if (!p.studentId) throw new ForbiddenException('Students only');
    await this.own.assert('job', jobId, c);
    const job = await this.prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    if (job.deadline && job.deadline < new Date()) throw new BadRequestException('Applications closed');
    const student = await this.studentForMatching(c, p.studentId);
    const m = computeMatch(student, {
      requiredSkills: job.requiredSkills,
      minCgpa: job.minCgpa === null ? null : Number(job.minCgpa),
      maxBacklogs: job.maxBacklogs,
      allowedDepartments: job.allowedDepartments,
    });
    if (!m.eligible)
      throw new ForbiddenException({
        message: 'Not eligible for this role',
        errorCode: 'NOT_ELIGIBLE',
        reasons: m.ineligibleReasons,
      });
    try {
      return await this.prisma.jobApplication.create({
        data: {
          collegeId: c,
          jobId,
          studentId: p.studentId,
          matchScore: m.score,
          matchReasons: m as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') throw new ConflictException('Already applied');
      throw e;
    }
  }
  myApplications(p: Principal, c: string) {
    return this.prisma.jobApplication.findMany({
      where: { collegeId: c, studentId: p.studentId ?? '__none__' },
      include: {
        job: { select: { title: true, company: { select: { name: true } } } },
        interviews: true,
        offers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async applicationsForJob(c: string, jobId: string, q: D.JobQueryDto) {
    await this.own.assert('job', jobId, c);
    const where = { collegeId: c, jobId };
    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        orderBy: { matchScore: 'desc' },
        ...toSkipTake(q),
        include: {
          student: { select: { rollNumber: true, cgpa: true, user: { select: { firstName: true, lastName: true } } } },
          interviews: true,
          offers: true,
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async updateStatus(c: string, id: string, dto: D.UpdateApplicationDto, actorId: string) {
    const app = await this.prisma.jobApplication.findFirst({
      where: { id, collegeId: c },
      include: { student: { select: { userId: true } }, job: { select: { title: true } } },
    });
    if (!app) throw new NotFoundException();
    if (!NEXT[app.status].includes(dto.status))
      throw new BadRequestException(`Cannot move from ${app.status} to ${dto.status}`);
    const updated = await this.prisma.jobApplication.update({ where: { id }, data: { status: dto.status } });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'APPLICATION_STATUS',
      entity: 'JobApplication',
      entityId: id,
      oldValue: app.status,
      newValue: dto.status,
    });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: [app.student.userId],
      type: 'ApplicationUpdated',
      title: `Application ${dto.status.toLowerCase()}`,
      body: app.job.title,
      data: { applicationId: id },
    });
    return updated;
  }
  async scheduleInterview(c: string, id: string, dto: D.ScheduleInterviewDto) {
    const app = await this.prisma.jobApplication.findFirst({ where: { id, collegeId: c } });
    if (!app) throw new NotFoundException();
    if (app.status !== 'SHORTLISTED' && app.status !== 'INTERVIEW')
      throw new BadRequestException('Shortlist the candidate first');
    const [iv] = await this.prisma.$transaction([
      this.prisma.interview.create({ data: { applicationId: id, ...dto, round: dto.round ?? 1 } }),
      this.prisma.jobApplication.update({ where: { id }, data: { status: 'INTERVIEW' } }),
    ]);
    return iv;
  }
  async issueOffer(c: string, id: string, dto: D.IssueOfferDto, actorId: string) {
    const app = await this.prisma.jobApplication.findFirst({ where: { id, collegeId: c } });
    if (!app) throw new NotFoundException();
    if (app.status !== 'INTERVIEW') throw new BadRequestException('Offer requires an interview stage');
    const [offer] = await this.prisma.$transaction([
      this.prisma.offer.create({ data: { applicationId: id, ctc: dto.ctc } }),
      this.prisma.jobApplication.update({ where: { id }, data: { status: 'OFFERED' } }),
    ]);
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'OFFER_ISSUE',
      entity: 'JobApplication',
      entityId: id,
      newValue: dto,
    });
    return offer;
  }

  async respondToOffer(
    studentId: string | undefined,
    c: string,
    offerId: string,
    accept: boolean,
    actorId?: string,
  ) {
    if (!studentId) throw new ForbiddenException('Student account required');
    const offer = await this.prisma.offer.findFirst({
      where: { id: offerId, application: { collegeId: c, studentId } },
      include: { application: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status !== 'ISSUED') {
      throw new BadRequestException('This offer has already been responded to');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: offerId },
        data: { status: accept ? 'ACCEPTED' : 'DECLINED' },
      });
      if (accept) {
        await tx.jobApplication.update({
          where: { id: offer.applicationId },
          data: { status: 'ACCEPTED' },
        });
      }
      await this.audit.log(
        {
          collegeId: c,
          userId: actorId ?? studentId,
          action: accept ? 'OFFER_ACCEPT' : 'OFFER_DECLINE',
          entity: 'Offer',
          entityId: offerId,
          oldValue: { offerStatus: offer.status, applicationStatus: offer.application.status },
          newValue: { offerStatus: updated.status, applicationStatus: accept ? 'ACCEPTED' : offer.application.status },
        },
        tx,
      );
      return updated;
    });
  }

  async withdrawApplication(studentId: string | undefined, c: string, applicationId: string) {
    if (!studentId) throw new ForbiddenException('Student account required');
    const app = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, collegeId: c, studentId },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status === 'OFFERED' || app.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot withdraw after an offer has been issued');
    }
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    });
  }
}
