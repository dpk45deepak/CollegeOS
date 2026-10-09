import { canPairMessage, kindOf } from './messaging-policy';

describe('messaging policy', () => {
  it('derives kinds with HOD taking precedence over TEACHER', () => {
    expect(kindOf(['TEACHER', 'HOD'])).toBe('HOD');
    expect(kindOf(['STUDENT'])).toBe('STUDENT');
  });
  it('blocks student↔student DMs but allows the documented pairs', () => {
    expect(canPairMessage('STUDENT', 'STUDENT')).toBe(false);
    expect(canPairMessage('STUDENT', 'TEACHER')).toBe(true);
    expect(canPairMessage('TEACHER', 'HOD')).toBe(true);
    expect(canPairMessage('STUDENT', 'ADMIN')).toBe(true);
  });
});
