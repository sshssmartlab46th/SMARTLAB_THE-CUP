import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore before importing firebaseService
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {}
}));

import { updateDoc } from 'firebase/firestore';
import {
  getMatchGrade,
  getMatchTournamentSlot,
  getMatchWinner,
  getMatchLoser,
  getRoundCompletionStatus,
  syncCompletedTournamentRounds
} from './firebaseService';
import { MatchItem } from '../types';

describe('Tournament Advancement Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMatchGrade', () => {
    it('extracts grade from homeClass if available', () => {
      const match: MatchItem = {
        id: 'm1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '축구 경기',
        round: '8강',
        homeTeam: '1-1반',
        awayTeam: '1-2반',
        homeClass: '201',
        awayClass: '202',
        homeScore: 1,
        awayScore: 0,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 1200,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T10:00:00.000Z'
      };
      expect(getMatchGrade(match)).toBe('2');
    });

    it('extracts grade from match title if homeClass is not descriptive', () => {
      const match: MatchItem = {
        id: 'm2',
        sport: 'basketball',
        matchType: 'tournament',
        title: '3학년 농구 4강 1경기',
        round: '4강',
        homeTeam: '팀A',
        awayTeam: '팀B',
        homeClass: 'A',
        awayClass: 'B',
        homeScore: 10,
        awayScore: 8,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 600,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '체육관',
        events: [],
        updatedAt: '2026-09-15T10:00:00.000Z'
      };
      expect(getMatchGrade(match)).toBe('3');
    });

    it('extracts grade from homeTeam if title does not mention grade', () => {
      const match: MatchItem = {
        id: 'm3',
        sport: 'dodgeball',
        matchType: 'tournament',
        title: '피구 준결승',
        round: '준결승',
        homeTeam: '1-3반',
        awayTeam: '1-4반',
        homeClass: '',
        awayClass: '',
        homeScore: 5,
        awayScore: 2,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 300,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '체육관',
        events: [],
        updatedAt: '2026-09-15T10:00:00.000Z'
      };
      expect(getMatchGrade(match)).toBe('1');
    });
  });

  describe('getMatchTournamentSlot', () => {
    it('returns tournamentSlot directly if specified on match', () => {
      const match: MatchItem = {
        id: 'm-slot',
        sport: 'soccer',
        matchType: 'tournament',
        tournamentSlot: 'QF3',
        title: '축구 경기',
        round: '8강',
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
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T08:00:00.000Z'
      };
      expect(getMatchTournamentSlot(match)).toBe('QF3');
    });

    it('identifies QF1, QF2, QF3, QF4 slots from round and title strings', () => {
      const createSlotMatch = (round: string, title: string): MatchItem => ({
        id: 'm-temp',
        sport: 'soccer',
        matchType: 'tournament',
        title,
        round,
        homeTeam: 'A',
        awayTeam: 'B',
        homeClass: '101',
        awayClass: '102',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        elapsedSeconds: 0,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T08:00:00.000Z'
      });

      expect(getMatchTournamentSlot(createSlotMatch('8강 1경기', '1학년 축구 8강 1경기'))).toBe('QF1');
      expect(getMatchTournamentSlot(createSlotMatch('8강 2경기', '1학년 축구 8강 2경기'))).toBe('QF2');
      expect(getMatchTournamentSlot(createSlotMatch('준준결승 3', '1학년 축구 준준결승 3'))).toBe('QF3');
      expect(getMatchTournamentSlot(createSlotMatch('8강 D', '1학년 축구 8강 D'))).toBe('QF4');
    });

    it('identifies SF1, SF2, FINAL, BRONZE slots', () => {
      const createSlotMatch = (round: string, title: string): MatchItem => ({
        id: 'm-temp',
        sport: 'soccer',
        matchType: 'tournament',
        title,
        round,
        homeTeam: 'A',
        awayTeam: 'B',
        homeClass: '101',
        awayClass: '102',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        elapsedSeconds: 0,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T08:00:00.000Z'
      });

      expect(getMatchTournamentSlot(createSlotMatch('4강 1경기', '1학년 축구 4강 1경기'))).toBe('SF1');
      expect(getMatchTournamentSlot(createSlotMatch('4강 2경기', '1학년 축구 4강 2경기'))).toBe('SF2');
      expect(getMatchTournamentSlot(createSlotMatch('3·4위전', '1학년 축구 3,4위전'))).toBe('BRONZE');
      expect(getMatchTournamentSlot(createSlotMatch('결승전', '1학년 축구 결승전'))).toBe('FINAL');
    });
  });

  describe('getMatchWinner and getMatchLoser', () => {
    it('returns null if match status is not FINISHED', () => {
      const liveMatch: MatchItem = {
        id: 'm-live',
        sport: 'soccer',
        matchType: 'tournament',
        title: '8강 1경기',
        round: '8강 1경기',
        homeTeam: '1-1반',
        awayTeam: '1-2반',
        homeClass: '101',
        awayClass: '102',
        homeScore: 3,
        awayScore: 1,
        status: 'LIVE',
        period: '전반전',
        elapsedSeconds: 300,
        timerRunning: true,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T09:05:00.000Z'
      };

      expect(getMatchWinner(liveMatch)).toBeNull();
      expect(getMatchLoser(liveMatch)).toBeNull();
    });

    it('determines winner and loser based on score when match is FINISHED', () => {
      const finishedMatch: MatchItem = {
        id: 'm-fin',
        sport: 'soccer',
        matchType: 'tournament',
        title: '8강 1경기',
        round: '8강 1경기',
        homeTeam: '1-1반',
        awayTeam: '1-2반',
        homeClass: '101',
        awayClass: '102',
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED',
        period: '경기 종료',
        elapsedSeconds: 1200,
        timerRunning: false,
        startTime: '2026-09-15T09:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T09:45:00.000Z'
      };

      const winner = getMatchWinner(finishedMatch);
      const loser = getMatchLoser(finishedMatch);

      expect(winner).toEqual({ name: '1-1반', classId: '101' });
      expect(loser).toEqual({ name: '1-2반', classId: '102' });
    });

    it('uses penalty shootout result to resolve tied matches', () => {
      const tiedMatchWithPK: MatchItem = {
        id: 'm-pk',
        sport: 'soccer',
        matchType: 'tournament',
        title: '8강 2경기',
        round: '8강 2경기',
        homeTeam: '1-3반',
        awayTeam: '1-4반',
        homeClass: '103',
        awayClass: '104',
        homeScore: 1,
        awayScore: 1,
        status: 'FINISHED',
        period: '승부차기 종료',
        elapsedSeconds: 1200,
        timerRunning: false,
        startTime: '2026-09-15T10:00:00.000Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-15T10:50:00.000Z',
        penaltyShootout: {
          isActive: false,
          homeScore: 4,
          awayScore: 5,
          homeKicks: [],
          awayKicks: [],
          winner: 'away'
        }
      };

      const winner = getMatchWinner(tiedMatchWithPK);
      const loser = getMatchLoser(tiedMatchWithPK);

      expect(winner).toEqual({ name: '1-4반', classId: '104' });
      expect(loser).toEqual({ name: '1-3반', classId: '103' });
    });
  });

  describe('getRoundCompletionStatus', () => {
    it('returns isComplete=true when all matches in a round are FINISHED with winners', () => {
      const matches: MatchItem[] = [
        {
          id: 'qf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF1',
          title: '1학년 축구 8강 1경기',
          round: '8강 1경기',
          homeTeam: '1-1반',
          awayTeam: '1-2반',
          homeClass: '101',
          awayClass: '102',
          homeScore: 2,
          awayScore: 0,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T09:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T09:40:00.000Z'
        },
        {
          id: 'qf2',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF2',
          title: '1학년 축구 8강 2경기',
          round: '8강 2경기',
          homeTeam: '1-3반',
          awayTeam: '1-4반',
          homeClass: '103',
          awayClass: '104',
          homeScore: 1,
          awayScore: 3,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T10:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T10:40:00.000Z'
        }
      ];

      const qfStatus = getRoundCompletionStatus(matches, 'soccer', '1', 'QF');

      expect(qfStatus.total).toBe(2);
      expect(qfStatus.finished).toBe(2);
      expect(qfStatus.isComplete).toBe(true);
      expect(qfStatus.missingWinners).toHaveLength(0);
    });

    it('returns isComplete=false when any match in the round is unfinished', () => {
      const matches: MatchItem[] = [
        {
          id: 'qf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF1',
          title: '1학년 축구 8강 1경기',
          round: '8강 1경기',
          homeTeam: '1-1반',
          awayTeam: '1-2반',
          homeClass: '101',
          awayClass: '102',
          homeScore: 2,
          awayScore: 0,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T09:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T09:40:00.000Z'
        },
        {
          id: 'qf2',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF2',
          title: '1학년 축구 8강 2경기',
          round: '8강 2경기',
          homeTeam: '1-3반',
          awayTeam: '1-4반',
          homeClass: '103',
          awayClass: '104',
          homeScore: 0,
          awayScore: 0,
          status: 'LIVE',
          period: '전반전',
          elapsedSeconds: 300,
          timerRunning: true,
          startTime: '2026-09-15T10:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T10:05:00.000Z'
        }
      ];

      const qfStatus = getRoundCompletionStatus(matches, 'soccer', '1', 'QF');

      expect(qfStatus.total).toBe(2);
      expect(qfStatus.finished).toBe(1);
      expect(qfStatus.isComplete).toBe(false);
      expect(qfStatus.missingWinners).toHaveLength(1);
    });
  });

  describe('syncCompletedTournamentRounds', () => {
    it('automatically advances winners to 4강 (SF1, SF2) when all 8강 matches are complete', async () => {
      const matches: MatchItem[] = [
        {
          id: 'qf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF1',
          title: '1학년 축구 8강 1경기',
          round: '8강 1경기',
          homeTeam: '1-1반',
          awayTeam: '1-2반',
          homeClass: '101',
          awayClass: '102',
          homeScore: 2,
          awayScore: 0,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T09:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T09:40:00.000Z'
        },
        {
          id: 'qf2',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF2',
          title: '1학년 축구 8강 2경기',
          round: '8강 2경기',
          homeTeam: '1-3반',
          awayTeam: '1-4반',
          homeClass: '103',
          awayClass: '104',
          homeScore: 0,
          awayScore: 1,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T10:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T10:40:00.000Z'
        },
        {
          id: 'qf3',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF3',
          title: '1학년 축구 8강 3경기',
          round: '8강 3경기',
          homeTeam: '1-5반',
          awayTeam: '1-6반',
          homeClass: '105',
          awayClass: '106',
          homeScore: 3,
          awayScore: 2,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T11:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T11:40:00.000Z'
        },
        {
          id: 'qf4',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF4',
          title: '1학년 축구 8강 4경기',
          round: '8강 4경기',
          homeTeam: '1-7반',
          awayTeam: '1-8반',
          homeClass: '107',
          awayClass: '108',
          homeScore: 1,
          awayScore: 2,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T12:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T12:40:00.000Z'
        },
        {
          id: 'sf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'SF1',
          title: '1학년 축구 4강 1경기',
          round: '4강 1경기',
          homeTeam: '미정',
          awayTeam: '미정',
          homeClass: '',
          awayClass: '',
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          period: '경기전',
          elapsedSeconds: 0,
          timerRunning: false,
          startTime: '2026-09-15T14:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T08:00:00.000Z'
        },
        {
          id: 'sf2',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'SF2',
          title: '1학년 축구 4강 2경기',
          round: '4강 2경기',
          homeTeam: '미정',
          awayTeam: '미정',
          homeClass: '',
          awayClass: '',
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          period: '경기전',
          elapsedSeconds: 0,
          timerRunning: false,
          startTime: '2026-09-15T15:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T08:00:00.000Z'
        }
      ];

      const result = await syncCompletedTournamentRounds(matches);

      expect(result.updatedCount).toBe(4);
      expect(result.logs.some((l) => l.includes('1-1반'))).toBe(true);
      expect(result.logs.some((l) => l.includes('1-4반'))).toBe(true);
      expect(result.logs.some((l) => l.includes('1-5반'))).toBe(true);
      expect(result.logs.some((l) => l.includes('1-8반'))).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(4);
    });

    it('does not advance prematurely when 8강 matches are incomplete', async () => {
      const matches: MatchItem[] = [
        {
          id: 'qf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF1',
          title: '1학년 축구 8강 1경기',
          round: '8강 1경기',
          homeTeam: '1-1반',
          awayTeam: '1-2반',
          homeClass: '101',
          awayClass: '102',
          homeScore: 2,
          awayScore: 0,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T09:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T09:40:00.000Z'
        },
        {
          id: 'qf2',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'QF2',
          title: '1학년 축구 8강 2경기',
          round: '8강 2경기',
          homeTeam: '1-3반',
          awayTeam: '1-4반',
          homeClass: '103',
          awayClass: '104',
          homeScore: 0,
          awayScore: 0,
          status: 'LIVE',
          period: '전반전',
          elapsedSeconds: 300,
          timerRunning: true,
          startTime: '2026-09-15T10:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T10:05:00.000Z'
        },
        {
          id: 'sf1',
          sport: 'soccer',
          matchType: 'tournament',
          tournamentSlot: 'SF1',
          title: '1학년 축구 4강 1경기',
          round: '4강 1경기',
          homeTeam: '미정',
          awayTeam: '미정',
          homeClass: '',
          awayClass: '',
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          period: '경기전',
          elapsedSeconds: 0,
          timerRunning: false,
          startTime: '2026-09-15T14:00:00.000Z',
          court: '대운동장 A',
          events: [],
          updatedAt: '2026-09-15T08:00:00.000Z'
        }
      ];

      const result = await syncCompletedTournamentRounds(matches);

      expect(result.updatedCount).toBe(0);
      expect(result.pendingInfo.length).toBeGreaterThan(0);
      expect(result.pendingInfo[0]).toContain('진행중');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('automatically advances 4강 winners to FINAL when 4강 is complete', async () => {
      const matches: MatchItem[] = [
        {
          id: 'sf1',
          sport: 'basketball',
          matchType: 'tournament',
          tournamentSlot: 'SF1',
          title: '2학년 농구 4강 1경기',
          round: '4강 1경기',
          homeTeam: '2-1반',
          awayTeam: '2-2반',
          homeClass: '201',
          awayClass: '202',
          homeScore: 24,
          awayScore: 18,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T13:00:00.000Z',
          court: '체육관',
          events: [],
          updatedAt: '2026-09-15T13:40:00.000Z'
        },
        {
          id: 'sf2',
          sport: 'basketball',
          matchType: 'tournament',
          tournamentSlot: 'SF2',
          title: '2학년 농구 4강 2경기',
          round: '4강 2경기',
          homeTeam: '2-3반',
          awayTeam: '2-4반',
          homeClass: '203',
          awayClass: '204',
          homeScore: 15,
          awayScore: 30,
          status: 'FINISHED',
          period: '종료',
          elapsedSeconds: 1200,
          timerRunning: false,
          startTime: '2026-09-15T14:00:00.000Z',
          court: '체육관',
          events: [],
          updatedAt: '2026-09-15T14:40:00.000Z'
        },
        {
          id: 'final1',
          sport: 'basketball',
          matchType: 'tournament',
          tournamentSlot: 'FINAL',
          title: '2학년 농구 결승전',
          round: '결승전',
          homeTeam: '미정',
          awayTeam: '미정',
          homeClass: '',
          awayClass: '',
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          period: '경기전',
          elapsedSeconds: 0,
          timerRunning: false,
          startTime: '2026-09-15T16:00:00.000Z',
          court: '체육관',
          events: [],
          updatedAt: '2026-09-15T08:00:00.000Z'
        }
      ];

      const result = await syncCompletedTournamentRounds(matches);

      expect(result.updatedCount).toBe(2);
      expect(result.logs.some((l) => l.includes('2-1반'))).toBe(true);
      expect(result.logs.some((l) => l.includes('2-4반'))).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
