import { describe, it, expect } from 'vitest';
import { maskLineupsForUser, isLineupRevealedForMatch } from './lineupMasking';
import { ClassLineup, MatchItem, UserProfile } from '../types';

describe('lineupMasking', () => {
  const sampleMatch: MatchItem = {
    id: 'match-1',
    sport: 'soccer',
    matchType: 'tournament',
    title: '1학년 축구 8강 1경기',
    round: '8강 1경기',
    homeTeam: '1-1반',
    awayTeam: '1-2반',
    homeClass: '101',
    awayClass: '102',
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    period: '경기전',
    elapsedSeconds: 0,
    timerRunning: false,
    startTime: '2026-09-15T10:00:00.000Z',
    events: [],
    updatedAt: '2026-09-15T08:00:00.000Z',
    court: '대운동장 A'
  };

  const sampleLineups: ClassLineup[] = [
    {
      id: 'lineup-101',
      matchId: 'match-1',
      classId: '101',
      sport: 'soccer',
      formation: '4-4-2',
      starterPlayers: ['10101 김철수', '10102 이영희'],
      substitutePlayers: ['10103 박민수'],
      submittedBy: '김철수',
      submittedAt: '2026-09-15T08:00:00.000Z'
    },
    {
      id: 'lineup-102',
      matchId: 'match-1',
      classId: '102',
      sport: 'soccer',
      formation: '4-3-3',
      starterPlayers: ['10201 홍길동', '10202 임꺽정'],
      substitutePlayers: ['10203 성춘향'],
      submittedBy: '홍길동',
      submittedAt: '2026-09-15T08:00:00.000Z'
    }
  ];

  const studentClass101: UserProfile = {
    uid: 'u-10101',
    studentId: '10101',
    name: '김철수',
    role: 'student',
    grade: '1',
    classNum: '1',
    studentNum: '01',
    gender: 'male',
    isTeacher: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastLogin: '2026-09-15T08:00:00.000Z'
  };

  const adminUser: UserProfile = {
    uid: 'u-admin',
    studentId: 'sshsgym',
    name: '총괄관리자',
    role: 'admin',
    grade: '관리자',
    classNum: '0',
    studentNum: '00',
    gender: 'other',
    isTeacher: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastLogin: '2026-09-15T08:00:00.000Z'
  };

  const matchStartTimeMs = new Date('2026-09-15T10:00:00.000Z').getTime();

  it('masks opposing class lineups for regular student when match is > 5 min away', () => {
    // 10 minutes before start
    const nowMs = matchStartTimeMs - 10 * 60 * 1000;

    const masked = maskLineupsForUser(sampleLineups, [sampleMatch], studentClass101, nowMs);

    // Own class lineup (101) remains full
    const myLineup = masked.find((l) => l.classId === '101');
    expect(myLineup?.starterPlayers).toEqual(['10101 김철수', '10102 이영희']);
    expect(myLineup?.formation).toBe('4-4-2');

    // Opposing class lineup (102) is masked
    const oppLineup = masked.find((l) => l.classId === '102');
    expect(oppLineup?.starterPlayers).toEqual([]);
    expect(oppLineup?.substitutePlayers).toEqual([]);
    expect(oppLineup?.formation).toBeUndefined();
  });

  it('reveals all lineups within 5 minutes of match start', () => {
    // 3 minutes before start
    const nowMs = matchStartTimeMs - 3 * 60 * 1000;

    const masked = maskLineupsForUser(sampleLineups, [sampleMatch], studentClass101, nowMs);

    const oppLineup = masked.find((l) => l.classId === '102');
    expect(oppLineup?.starterPlayers).toEqual(['10201 홍길동', '10202 임꺽정']);
    expect(oppLineup?.formation).toBe('4-3-3');
  });

  it('reveals all lineups to authorized roles at any time', () => {
    // 30 minutes before start
    const nowMs = matchStartTimeMs - 30 * 60 * 1000;

    const masked = maskLineupsForUser(sampleLineups, [sampleMatch], adminUser, nowMs);

    const oppLineup = masked.find((l) => l.classId === '102');
    expect(oppLineup?.starterPlayers).toEqual(['10201 홍길동', '10202 임꺽정']);
  });

  it('reveals lineups if match status is LIVE or FINISHED', () => {
    const liveMatch = { ...sampleMatch, status: 'LIVE' as const };
    const nowMs = matchStartTimeMs - 30 * 60 * 1000;

    const masked = maskLineupsForUser(sampleLineups, [liveMatch], studentClass101, nowMs);

    const oppLineup = masked.find((l) => l.classId === '102');
    expect(oppLineup?.starterPlayers).toEqual(['10201 홍길동', '10202 임꺽정']);
  });
});
