import { describe, it, expect } from 'vitest';
import { createSignedSessionToken, verifySessionToken } from './sessionService';
import { UserProfile } from '../src/types';

describe('SessionService HMAC Signed Tokens', () => {
  const sampleStudentProfile: UserProfile = {
    uid: 'user_30215',
    studentId: '30215',
    name: '강상산',
    role: 'student',
    roles: ['student'],
    grade: '3',
    classNum: '02',
    studentNum: '15',
    gender: 'male',
    isTeacher: false,
    createdAt: '2026-09-08T00:00:00.000Z',
    lastLogin: '2026-09-08T00:00:00.000Z'
  };

  const sampleAdminProfile: UserProfile = {
    uid: 'admin_sshsgym',
    studentId: 'sshsgym',
    name: '총괄 관리자',
    role: 'admin',
    roles: ['admin', 'student'],
    grade: '본부',
    classNum: '00',
    studentNum: '00',
    gender: 'other',
    isTeacher: false,
    canAnswerSuggestion: true,
    createdAt: '2026-09-08T00:00:00.000Z',
    lastLogin: '2026-09-08T00:00:00.000Z'
  };

  it('should generate a valid signed token and verify it successfully', () => {
    const token = createSignedSessionToken(sampleStudentProfile);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.studentId).toBe('30215');
    expect(verified?.role).toBe('student');
    expect(verified?.name).toBe('강상산');
  });

  it('should correctly verify admin profile tokens', () => {
    const token = createSignedSessionToken(sampleAdminProfile);
    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('admin');
    expect(verified?.studentId).toBe('sshsgym');
  });

  it('should reject tampered payload when role is changed in token string', () => {
    const token = createSignedSessionToken(sampleStudentProfile);
    const [base64Payload, signature] = token.split('.');

    // Tamper payload by changing 'student' to 'admin'
    const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const tamperedPayloadStr = payloadStr.replace('"role":"student"', '"role":"admin"');
    const tamperedBase64Payload = Buffer.from(tamperedPayloadStr, 'utf-8').toString('base64url');

    const tamperedToken = `${tamperedBase64Payload}.${signature}`;

    const verified = verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('should reject tokens signed with a different secret key', () => {
    const tokenSignedWithOtherSecret = createSignedSessionToken(sampleStudentProfile, 'different_secret_key');
    const verified = verifySessionToken(tokenSignedWithOtherSecret, 'default_secret_key');
    expect(verified).toBeNull();
  });

  it('should return null for malformed or empty tokens', () => {
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken(null as any)).toBeNull();
    expect(verifySessionToken('invalid_token_without_dot')).toBeNull();
    expect(verifySessionToken('part1.part2.part3')).toBeNull();
  });
});
