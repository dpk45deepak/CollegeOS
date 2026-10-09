import { Principal } from '../../common/types/principal';
import { ToolRegistry } from './tool-registry';
import { AiTool, ToolError } from './tool.types';
import { StudentResolver } from './student-resolver';

const principal = (over: Partial<Principal>): Principal => ({
  userId: 'u1',
  collegeId: 'c1',
  sessionId: 's',
  roleKeys: ['STUDENT'],
  permissions: ['AI_CHAT', 'ATTENDANCE_VIEW_OWN'],
  departmentIds: [],
  studentId: 'stu1',
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...over,
});

function registryWith(tools: AiTool[]) {
  return new ToolRegistry({ tools: () => tools } as never, { tools: () => [] } as never);
}
const tool = (over: Partial<AiTool> = {}): AiTool => ({
  name: 'getAttendance',
  description: 'd',
  parameters: {},
  anyOf: ['ATTENDANCE_VIEW_OWN', 'ATTENDANCE_VIEW'],
  execute: async () => ({ summary: 's', data: { ok: 1 } }),
  ...over,
});

describe('ToolRegistry security', () => {
  it('hides tools the user has no permission for', () => {
    const r = registryWith([tool(), tool({ name: 'adminOnly', anyOf: ['AI_ADMIN'] })]);
    expect(r.specsFor(principal({})).map((s) => s.function.name)).toEqual(['getAttendance']);
  });
  it('refuses execution without permission even if the model names the tool', async () => {
    const r = registryWith([tool({ name: 'adminOnly', anyOf: ['AI_ADMIN'], execute: jest.fn() })]);
    const out = await r.execute('adminOnly', '{}', { principal: principal({}), collegeId: 'c1' });
    expect(out.ok).toBe(false);
    expect(out.content).toContain('permission');
  });
  it('rejects tools outside the agent allow-list', async () => {
    const r = registryWith([tool()]);
    expect(
      (await r.execute('getAttendance', '{}', { principal: principal({}), collegeId: 'c1' }, ['getFees'])).ok,
    ).toBe(false);
  });
  it('rejects malformed arguments and unknown tools', async () => {
    const r = registryWith([tool()]);
    expect((await r.execute('getAttendance', 'not json', { principal: principal({}), collegeId: 'c1' })).ok).toBe(
      false,
    );
    expect((await r.execute('dropTables', '{}', { principal: principal({}), collegeId: 'c1' })).ok).toBe(false);
  });
  it('never leaks internal error text to the model', async () => {
    const r = registryWith([
      tool({
        execute: async () => {
          throw new Error('connection string postgres://secret@db');
        },
      }),
    ]);
    const out = await r.execute('getAttendance', '{}', { principal: principal({}), collegeId: 'c1' });
    expect(out.content).not.toContain('secret');
  });
  it('passes through safe ToolError messages and truncates huge results', async () => {
    const r = registryWith([
      tool({
        execute: async () => {
          throw new ToolError('Which child do you mean?');
        },
      }),
    ]);
    expect((await r.execute('getAttendance', '{}', { principal: principal({}), collegeId: 'c1' })).content).toContain(
      'Which child',
    );
    const big = registryWith([tool({ execute: async () => ({ summary: 's', data: 'x'.repeat(20000) }) })]);
    expect(
      (await big.execute('getAttendance', '{}', { principal: principal({}), collegeId: 'c1' })).content.length,
    ).toBeLessThan(6100);
  });
});

describe('StudentResolver (model cannot pick another student)', () => {
  const access = { canAccessStudent: jest.fn(async (_p: Principal, _c: string, id: string) => id === 'allowed') };
  const resolver = new StudentResolver(access as never);
  it('students always resolve to themselves, ignoring the argument', async () => {
    expect(await resolver.resolve({ principal: principal({}), collegeId: 'c1' }, 'someone-else')).toBe('stu1');
  });
  it('parents may only pick their own wards', async () => {
    const p = principal({ studentId: undefined, roleKeys: ['PARENT'], guardianOfStudentIds: ['k1', 'k2'] });
    expect(await resolver.resolve({ principal: p, collegeId: 'c1' }, 'k2')).toBe('k2');
    await expect(resolver.resolve({ principal: p, collegeId: 'c1' }, 'stranger')).rejects.toThrow(/Multiple wards/);
  });
  it('staff are checked against their access scope', async () => {
    const p = principal({ studentId: undefined, teacherId: 't1', roleKeys: ['TEACHER'] });
    expect(await resolver.resolve({ principal: p, collegeId: 'c1' }, 'allowed')).toBe('allowed');
    await expect(resolver.resolve({ principal: p, collegeId: 'c1' }, 'other')).rejects.toThrow(/outside/);
  });
});
