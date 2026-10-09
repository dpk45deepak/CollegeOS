import { buildStudyPlan, PlanInput } from './study-plan';

const base: PlanInput = { exams: [], subjects: [], overallExamAvg: 68, attendanceFlags: [], pendingAssignments: [] };
describe('study plan', () => {
  it('prioritises the near, weak-subject exam first', () => {
    const plan = buildStudyPlan({
      ...base,
      exams: [
        { subject: 'Mathematics', subjectId: 'm', daysAway: 5 },
        { subject: 'Physics', subjectId: 'p', daysAway: 20 },
      ],
      subjects: [
        {
          subjectId: 'm',
          name: 'Mathematics',
          examAvgPct: 52,
          weak: true,
          weakReasons: ['exam average below 60%'],
          attendancePct: 80,
        },
        { subjectId: 'p', name: 'Physics', examAvgPct: 75, weak: false, weakReasons: [], attendancePct: 90 },
      ],
    });
    expect(plan[0]).toMatchObject({ type: 'EXAM_PREP', subject: 'Mathematics', priority: 'HIGH' });
    expect(plan[0].text).toContain('52%');
    expect(plan[0].basedOn.join(' ')).toContain('5 day');
  });
  it('never invents units/topics', () => {
    const plan = buildStudyPlan({ ...base, exams: [{ subject: 'Maths', subjectId: 'm', daysAway: 3 }] });
    expect(plan[0].text).not.toMatch(/unit \d/i);
  });
  it('adds attendance and imminent deadline items', () => {
    const plan = buildStudyPlan({
      ...base,
      attendanceFlags: [{ type: 'BELOW_THRESHOLD', subjectName: 'DBMS', detail: '70% (needs 3 more)' }],
      pendingAssignments: [
        { title: 'Lab 4', subject: 'OS', dueInDays: 1 },
        { title: 'Far', subject: 'OS', dueInDays: 20 },
      ],
    });
    expect(plan.map((p) => p.type)).toEqual(expect.arrayContaining(['ATTENDANCE', 'DEADLINE']));
    expect(plan.filter((p) => p.type === 'DEADLINE')).toHaveLength(1);
  });
  it('ignores exams more than 30 days away', () => {
    expect(buildStudyPlan({ ...base, exams: [{ subject: 'X', subjectId: 'x', daysAway: 45 }] })).toEqual([]);
  });
});
