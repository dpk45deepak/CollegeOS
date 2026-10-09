import { missingDetails } from './complaint-draft';

describe('missingDetails (grievance assistant follow-ups)', () => {
  it('asks for date and subject on a vague attendance dispute', () => {
    const q = missingDetails('My teacher marked me absent even though I attended', 'ATTENDANCE');
    expect(q.join(' ')).toMatch(/date/i);
    expect(q.join(' ')).toMatch(/subject/i);
  });
  it('asks for nothing more when details are present', () => {
    expect(
      missingDetails('Marked absent yesterday in the DBMS lecture although I was present in class', 'ATTENDANCE'),
    ).toEqual([]);
  });
  it('asks for payment reference on fee issues', () => {
    expect(missingDetails('My fee payment was deducted but not shown in the portal', 'FEES').join(' ')).toMatch(
      /transaction/i,
    );
  });
  it('caps follow-ups at three', () => {
    expect(missingDetails('bad', 'ATTENDANCE').length).toBeLessThanOrEqual(3);
  });
});
