import { describe, it, expect } from 'vitest';
import { createLiveCommentaryPayload, isSpeechRecognitionSupported } from './sttService';
import { UserProfile } from '../types';

describe('sttService', () => {
  it('should detect if speech recognition is supported or false in Node environment', () => {
    const supported = isSpeechRecognitionSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should construct a valid LiveCommentaryItem payload', () => {
    const mockUser: UserProfile = {
      uid: 'user-10203',
      studentId: '10203',
      name: '이해설',
      role: 'commentator',
      grade: '1',
      classNum: '2',
      studentNum: '03',
      gender: 'male',
      isTeacher: false,
      createdAt: '2026-09-08T00:00:00Z',
      lastLogin: '2026-09-08T00:00:00Z'
    };

    const payload = createLiveCommentaryPayload(
      'match-123',
      '멋진 골입니다! 1대0 선제골!',
      '이해설 대표 해설위원',
      mockUser,
      true
    );

    expect(payload.matchId).toBe('match-123');
    expect(payload.authorId).toBe('10203');
    expect(payload.authorName).toBe('이해설');
    expect(payload.authorRole).toBe('commentator');
    expect(payload.commentatorName).toBe('이해설 대표 해설위원');
    expect(payload.text).toBe('멋진 골입니다! 1대0 선제골!');
    expect(payload.isSttGenerated).toBe(true);
    expect(payload.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(payload.createdAt).toBeTruthy();
  });
});
