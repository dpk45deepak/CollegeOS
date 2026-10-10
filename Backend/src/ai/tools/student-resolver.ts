import { Injectable } from '@nestjs/common';
import { AccessService } from '../../access/access.service';
import { ToolContext, ToolError } from './tool.types';

/**
 * Decides WHICH student a tool call is about — from the authenticated principal, never from model-invented ids.
 *  student → themself (argument ignored) · parent → their ward (argument must be one of their wards)
 *  staff   → argument must be a student inside their scope
 */
@Injectable()
export class StudentResolver {
  constructor(private readonly access: AccessService) {}

  async resolve(ctx: ToolContext, requested?: string): Promise<string> {
    const p = ctx.principal;
    if (p.studentId) return p.studentId;
    if (p.guardianOfStudentIds.length) {
      if (requested && p.guardianOfStudentIds.includes(requested)) return requested;
      if (p.guardianOfStudentIds.length === 1) return p.guardianOfStudentIds[0];
      throw new ToolError('Multiple wards are linked to this account. Ask the user which child they mean.');
    }
    if (!requested) throw new ToolError('studentId is required. Use findStudents to look the student up first.');
    if (!(await this.access.canAccessStudent(p, ctx.collegeId, requested)))
      throw new ToolError('That student is outside your access scope.');
    return requested;
  }
}
