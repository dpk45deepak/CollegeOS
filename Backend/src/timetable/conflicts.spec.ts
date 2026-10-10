import { findConflicts, SlotLike } from './conflicts';

const base: SlotLike = {
  dayOfWeek: 'MON',
  startMinute: 540,
  endMinute: 600,
  sectionId: 's1',
  teacherId: 't1',
  roomId: 'r1',
  validFrom: new Date('2026-07-01'),
};

describe('timetable conflicts', () => {
  it('detects section, teacher and room clashes', () => {
    const c = findConflicts({ ...base, startMinute: 570, endMinute: 630 }, [{ ...base, id: 'x' }])
      .map((x) => x.type)
      .sort();
    expect(c).toEqual(['ROOM', 'SECTION', 'TEACHER']);
  });
  it('allows back-to-back classes', () => {
    expect(findConflicts({ ...base, startMinute: 600, endMinute: 660 }, [{ ...base, id: 'x' }])).toEqual([]);
  });
  it('ignores other days and non-overlapping validity', () => {
    expect(findConflicts({ ...base, dayOfWeek: 'TUE' }, [{ ...base, id: 'x' }])).toEqual([]);
    expect(
      findConflicts({ ...base, validFrom: new Date('2027-01-01') }, [
        { ...base, id: 'x', validTo: new Date('2026-12-31') },
      ]),
    ).toEqual([]);
  });
  it('only flags the shared resource', () => {
    const c = findConflicts({ ...base, sectionId: 's2', teacherId: 't2' }, [{ ...base, id: 'x' }]);
    expect(c.map((x) => x.type)).toEqual(['ROOM']);
  });
  it('does not conflict with itself when editing', () => {
    expect(findConflicts({ ...base, id: 'x' }, [{ ...base, id: 'x' }])).toEqual([]);
  });
  it('enforces teacher availability only when declared', () => {
    expect(findConflicts(base, [], [])).toEqual([]);
    expect(
      findConflicts(base, [], [{ dayOfWeek: 'MON', startMinute: 600, endMinute: 900 }]).map((x) => x.type),
    ).toEqual(['TEACHER_UNAVAILABLE']);
    expect(findConflicts(base, [], [{ dayOfWeek: 'MON', startMinute: 480, endMinute: 720 }])).toEqual([]);
  });
});
