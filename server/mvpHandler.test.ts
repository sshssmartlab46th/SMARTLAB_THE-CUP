import { describe, it, expect, vi } from 'vitest';
import { MatchItem, MVPVote, UserProfile } from '../src/types';
import { validateServerMvpVote, handleMvpVote } from './mvpHandler';

describe('Server-Authoritative MVP Vote Validation (mvpHandler)', () => {
  const baseFinishedMatch: MatchItem = {
    id: 'match-201',
    sport: 'basketball',
    matchType: 'tournament',
    title: '1학년 농구 결승전',
    round: '결승전',
    court: '체육관 1층',
    status: 'FINISHED',
    period: '경기 종료',
    homeTeam: '1-1반',
    awayTeam: '1-2반',
    homeClass: '101',
    awayClass: '102',
    homeScore: 32,
    awayScore: 28,
    elapsedSeconds: 1600,
    timerRunning: false,
    startTime: '2026-09-15T14:00:00.000Z',
    events: [],
    updatedAt: '2026-09-15T15:00:00.000Z'
  };

  const validStudentUser: UserProfile = {
    uid: '10105',
    studentId: '10105',
    name: '김상산',
    role: 'student',
    roles: ['student'],
    grade: '1',
    classNum: '1',
    studentNum: '05',
    gender: 'male',
    isTeacher: false,
    createdAt: '2026-09-15T00:00:00.000Z',
    lastLogin: '2026-09-15T00:00:00.000Z'
  };

  const validVote: MVPVote = {
    id: 'mvp_match-201_10105',
    matchId: 'match-201',
    voterStudentId: '10105',
    candidateName: '1-1반 23번',
    createdAt: '2026-09-15T15:00:30.000Z'
  };

  const finishServerMs = new Date('2026-09-15T15:00:00.000Z').getTime();

  it('validates and accepts a valid vote within 1 minute of match completion', () => {
    const voteTimeMs = finishServerMs + 30 * 1000; // 30s after match finish
    const res = validateServerMvpVote(baseFinishedMatch, validVote, validStudentUser, voteTimeMs);

    expect(res.valid).toBe(true);
    expect(res.status).toBe(200);
    expect(res.verifiedVote).toBeDefined();
    expect(res.verifiedVote?.id).toBe('mvp_match-201_10105');
    expect(res.verifiedVote?.voterStudentId).toBe('10105');
  });

  it('rejects vote if match is not in FINISHED status', () => {
    const liveMatch = { ...baseFinishedMatch, status: 'LIVE' as const };
    const res = validateServerMvpVote(liveMatch, validVote, validStudentUser, finishServerMs + 10000);

    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.message).toContain('경기 종료 후에만');
  });

  it('rejects vote if voterStudentId does not match authenticated user studentId (prevents spoofing)', () => {
    const spoofedVote: MVPVote = { ...validVote, voterStudentId: '10106' };
    const res = validateServerMvpVote(baseFinishedMatch, spoofedVote, validStudentUser, finishServerMs + 10000);

    expect(res.valid).toBe(false);
    expect(res.status).toBe(403);
    expect(res.message).toContain('로그인된 계정 정보와 투표자 학번이 일치하지 않습니다.');
  });

  it('rejects vote if student ID is not a valid 5-digit number', () => {
    const invalidUser = { ...validStudentUser, studentId: '999' };
    const invalidVote = { ...validVote, voterStudentId: '999' };
    const res = validateServerMvpVote(baseFinishedMatch, invalidVote, invalidUser, finishServerMs + 10000);

    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.message).toContain('유효한 5자리 학번이 아닙니다.');
  });

  it('rejects vote if candidateName is empty', () => {
    const emptyCandVote = { ...validVote, candidateName: '   ' };
    const res = validateServerMvpVote(baseFinishedMatch, emptyCandVote, validStudentUser, finishServerMs + 10000);

    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.message).toContain('선수를 선택해 주세요');
  });

  it('rejects vote if 1 minute (60 seconds) has passed since match completion', () => {
    const expiredTimeMs = finishServerMs + 61 * 1000; // 61s after finish
    const res = validateServerMvpVote(baseFinishedMatch, validVote, validStudentUser, expiredTimeMs);

    expect(res.valid).toBe(false);
    expect(res.status).toBe(408);
    expect(res.message).toContain('1분 초과');
  });

  it('handleMvpVote fetches match from currentMatches map if not provided in req', async () => {
    const currentMatches = new Map<string, MatchItem>();
    currentMatches.set(baseFinishedMatch.id, baseFinishedMatch);

    const result = await handleMvpVote(
      {
        vote: validVote,
        currentUser: validStudentUser
      },
      undefined,
      currentMatches,
      finishServerMs + 20000
    );

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.vote?.candidateName).toBe('1-1반 23번');
  });
});
