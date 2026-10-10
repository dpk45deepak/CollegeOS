import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TenantModel =
  | 'campus'
  | 'department'
  | 'program'
  | 'batch'
  | 'semester'
  | 'section'
  | 'subject'
  | 'student'
  | 'teacher'
  | 'subjectOffering'
  | 'room'
  | 'exam'
  | 'assignment'
  | 'feeStructure'
  | 'studentFee'
  | 'scholarship'
  | 'company'
  | 'job'
  | 'complaint'
  | 'document'
  | 'gradingScheme'
  | 'notice'
  | 'timetableSlot';

/** Verifies a referenced id belongs to the caller's tenant. Cross-tenant ids look like "not found". */
@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly counters: Record<TenantModel, (ids: string[], c: string) => Promise<number>> = {
    campus: (ids, c) => this.prisma.campus.count({ where: { id: { in: ids }, collegeId: c } }),
    department: (ids, c) => this.prisma.department.count({ where: { id: { in: ids }, collegeId: c } }),
    program: (ids, c) => this.prisma.program.count({ where: { id: { in: ids }, collegeId: c } }),
    batch: (ids, c) => this.prisma.batch.count({ where: { id: { in: ids }, collegeId: c } }),
    semester: (ids, c) => this.prisma.semester.count({ where: { id: { in: ids }, collegeId: c } }),
    section: (ids, c) => this.prisma.section.count({ where: { id: { in: ids }, collegeId: c } }),
    subject: (ids, c) => this.prisma.subject.count({ where: { id: { in: ids }, collegeId: c } }),
    student: (ids, c) => this.prisma.student.count({ where: { id: { in: ids }, collegeId: c } }),
    teacher: (ids, c) => this.prisma.teacher.count({ where: { id: { in: ids }, collegeId: c } }),
    subjectOffering: (ids, c) => this.prisma.subjectOffering.count({ where: { id: { in: ids }, collegeId: c } }),
    room: (ids, c) => this.prisma.room.count({ where: { id: { in: ids }, collegeId: c } }),
    exam: (ids, c) => this.prisma.exam.count({ where: { id: { in: ids }, collegeId: c } }),
    assignment: (ids, c) => this.prisma.assignment.count({ where: { id: { in: ids }, collegeId: c } }),
    feeStructure: (ids, c) => this.prisma.feeStructure.count({ where: { id: { in: ids }, collegeId: c } }),
    studentFee: (ids, c) => this.prisma.studentFee.count({ where: { id: { in: ids }, collegeId: c } }),
    scholarship: (ids, c) => this.prisma.scholarship.count({ where: { id: { in: ids }, collegeId: c } }),
    company: (ids, c) => this.prisma.company.count({ where: { id: { in: ids }, collegeId: c } }),
    job: (ids, c) => this.prisma.job.count({ where: { id: { in: ids }, collegeId: c } }),
    complaint: (ids, c) => this.prisma.complaint.count({ where: { id: { in: ids }, collegeId: c } }),
    document: (ids, c) => this.prisma.document.count({ where: { id: { in: ids }, collegeId: c } }),
    gradingScheme: (ids, c) => this.prisma.gradingScheme.count({ where: { id: { in: ids }, collegeId: c } }),
    notice: (ids, c) => this.prisma.notice.count({ where: { id: { in: ids }, collegeId: c } }),
    timetableSlot: (ids, c) => this.prisma.timetableSlot.count({ where: { id: { in: ids }, collegeId: c } }),
  };

  async assert(model: TenantModel, ids: string | string[] | undefined | null, collegeId: string): Promise<void> {
    if (!ids) return;
    const list = [...new Set(Array.isArray(ids) ? ids : [ids])];
    if (list.length === 0) return;
    if ((await this.counters[model](list, collegeId)) !== list.length) {
      throw new NotFoundException(`${model} not found`);
    }
  }
}
