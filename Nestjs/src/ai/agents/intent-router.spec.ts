import { classifyIntent } from './intent-router';

const cases: [string, string][] = [
  ['How much attendance do I have?', 'AttendanceAdvisorAgent'],
  ['When is my next exam?', 'AcademicAssistantAgent'],
  ['What documents do I need for scholarship?', 'ScholarshipAgent'],
  ['Explain the attendance rule.', 'CollegeKnowledgeAgent'],
  ['Which assignments are due this week?', 'AcademicAssistantAgent'],
  ['Who handles hostel complaints?', 'GrievanceAgent'],
  ['Find scholarships I am eligible for', 'ScholarshipAgent'],
  ['What are my weak subjects?', 'AcademicAssistantAgent'],
  ['What should I study before my next exam?', 'AcademicAssistantAgent'],
  ["My scholarship hasn't been credited", 'GrievanceAgent'],
  ["My teacher marked me absent even though I attended today's lecture", 'GrievanceAgent'],
  ['Any job openings for CSE?', 'PlacementAgent'],
  ['What is the leave policy for students?', 'CollegeKnowledgeAgent'],
];
describe('intent router (spec example questions)', () => {
  it.each(cases)('%s → %s', (q, agent) => {
    expect(classifyIntent(q).agent).toBe(agent);
  });
  it('marks unknown small talk as not confident', () => {
    expect(classifyIntent('hello there').confident).toBe(false);
  });
});
