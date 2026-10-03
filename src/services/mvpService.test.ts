import { describe, it, expect, vi } from 'vitest';
import { MatchItem, MVPVote, UserProfile } from '../types';
import {
  validateAndSubmitMVPVote,
  getMvpVotingDeadline,
  getMvpVotingTimeLeftSeconds
} from './mvpService';

describe('MVP Voting Service Verification', () => {
  const baseMatch: MatchItem = {
    id: 'match-101',
    sport: 'soccer',
    matchType: 'tournament',
    title: '1학년 축구 결승전',
    round: '결승전',
    court: '대운동장 A',
    status: 'FINISHED',
    period: '경기 종료',
    homeTeam: '1-1반',
    awayTeam: '1-2반',
    homeClass: '101',
    awayClass: '102',
    homeScore: 2,
    awayScore: 1,
    elapsedSeconds: 1200,
    timerRunning: false,
    startTime: '2026-09-15T09:00:00.000Z',
    events: [],
    updatedAt: '2026-09-15T10:00:00.000Z'
  };

  const validUser: UserProfile = {
    uid: '10208',
    studentId: '10208',
    name: '홍길동',
    role: 'student',
    roles: ['student'],
    grade: '1',
    classNum: '2',
    studentNum: '08',
    gender: 'male',
    isTeacher: false,
    createdAt: '2026-09-15T00:00:00.000Z',
    lastLogin: '2026-09-15T00:00:00.000Z'
  };

  const validVote: MVPVote = {
    id: 'mvp_match-101_10208',
    matchId: 'match-101',
    voterStudentId: '10208',
    candidateName: '1-1반 주장',
    createdAt: '2026-09-15T10:00:30.000Z'
  };

  it('calculates 1-minute voting deadline correctly based on match updatedAt/mvpVotingClosedAt', () => {
    const updatedAtMs = new Date('2026-09-15T10:00:00.000Z').getTime();
    expect(getMvpVotingDeadline(baseMatch)).toBe(updatedAtMs + 60 * 1000);

    const now30sLater = updatedAtMs + 30 * 1000;
    expect(getMvpVotingTimeLeftSeconds(baseMatch, now30sLater)).toBe(30);

    const now70sLater = updatedAtMs + 70 * 1000;
    expect(getMvpVotingTimeLeftSeconds(baseMatch, now70sLater)).toBe(0);
  });

  it('allows valid MVP vote within 1 minute for authenticated 5-digit student', async () => {
    const submitFn = vi.fn().mockResolvedValue(undefined);
    const finishMs = new Date('2026-09-15T10:00:00.000Z').getTime();
    const voteTimeMs = finishMs + 25 * 1000; // 25 seconds after match finish

    await expect(
      validateAndSubmitMVPVote(baseMatch, validVote, validUser, voteTimeMs, submitFn)
    ).resolves.not.toThrow();

    expect(submitFn).toHaveBeenCalledOnce();
    expect(submitFn).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-101',
        voterStudentId: '10208',
        candidateName: '1-1반 주장'
      })
    );
  });

  it('rejects vote if match status is not FINISHED', async () => {
    const liveMatch: MatchItem = { ...baseMatch, status: 'LIVE' };
    const submitFn = vi.fn();

    await expect(
      validateAndSubmitMVPVote(liveMatch, validVote, validUser, Date.now(), submitFn)
    ).rejects.toThrow('경기 종료 후에만 MVP 투표에 참여할 수 있습니다.');

    expect(submitFn).not.toHaveBeenCalled();
  });

  it('rejects vote if student ID in vote payload does not match authenticated user ID (prevents spoofing)', async () => {
    const spoofedVote: MVPVote = { ...validVote, voterStudentId: '10209' };
    const submitFn = vi.fn();

    await expect(
      validateAndSubmitMVPVote(baseMatch, spoofedVote, validUser, Date.now(), submitFn)
    ).rejects.toThrow('로그인된 계정 정보와 투표자 학번이 일치하지 않습니다.');

    expect(submitFn).not.toHaveBeenCalled();
  });

  it('rejects vote if student ID format is invalid (not 5-digit number)', async () => {
    const invalidUser: UserProfile = { ...validUser, studentId: '123' };
    const invalidVote: MVPVote = { ...validVote, voterStudentId: '123' };
    const submitFn = vi.fn();

    await expect(
      validateAndSubmitMVPVote(baseMatch, invalidVote, invalidUser, Date.now(), submitFn)
    ).rejects.toThrow('유효한 5자리 학번이 아닙니다.');

    expect(submitFn).not.toHaveBeenCalled();
  });

  it('rejects vote if more than 1 minute (60s) has elapsed since match finish', async () => {
    const submitFn = vi.fn();
    const finishMs = new Date('2026-09-15T10:00:00.000Z').getTime();
    const lateVoteTimeMs = finishMs + 61 * 1000; // 61 seconds after match finish

    await expect(
      validateAndSubmitMVPVote(baseMatch, validVote, validUser, lateVoteTimeMs, submitFn)
    ).rejects.toThrow('MVP 투표 시간이 마감되었습니다. (경기 종료 후 1분 초과)');

    expect(submitFn).not.toHaveBeenCalled();
  });
});
