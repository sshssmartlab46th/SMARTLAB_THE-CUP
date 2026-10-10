import { describe, it, expect } from 'vitest';
import { calculateClassStandings } from './standingsCalculator';
import { MatchItem } from '../types';

describe('calculateClassStandings', () => {
  it('should initialize all 36 classes (3 grades x 12 classes)', () => {
    const standings = calculateClassStandings([]);
    expect(standings.length).toBe(36);
    expect(standings.some((s) => s.classId === '101')).toBe(true);
    expect(standings.some((s) => s.classId === '312')).toBe(true);
  });

  it('should calculate participation and match points correctly', () => {
    const matches: MatchItem[] = [
      {
        id: 'm1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '축구 8강 1경기',
        round: '8강',
        homeTeam: '3-1반',
        awayTeam: '3-2반',
        homeClass: '301',
        awayClass: '302',
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 2400,
        timerRunning: false,
        startTime: '2026-09-08T09:00:00Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-08T10:00:00Z'
      }
    ];

    const standings = calculateClassStandings(matches);
    const class301 = standings.find((s) => s.classId === '301')!;
    const class302 = standings.find((s) => s.classId === '302')!;

    // 301: participation 50 + win 100 = 150
    expect(class301.totalPoints).toBe(150);
    expect(class301.wins).toBe(1);

    // 302: participation 50 + loss 0 = 50
    expect(class302.totalPoints).toBe(50);
    expect(class302.losses).toBe(1);
  });

  it('should award gold and silver medals for finals', () => {
    const matches: MatchItem[] = [
      {
        id: 'final-1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '축구 결승전',
        round: '결승전',
        tournamentSlot: 'FINAL',
        homeTeam: '3-1반',
        awayTeam: '3-2반',
        homeClass: '301',
        awayClass: '302',
        homeScore: 3,
        awayScore: 2,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 2400,
        timerRunning: false,
        startTime: '2026-09-08T14:00:00Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-08T15:00:00Z'
      }
    ];

    const standings = calculateClassStandings(matches);
    const class301 = standings.find((s) => s.classId === '301')!;
    const class302 = standings.find((s) => s.classId === '302')!;

    expect(class301.goldCount).toBe(1);
    expect(class301.totalPoints).toBe(550); // 50 participation + 500 champion

    expect(class302.silverCount).toBe(1);
    expect(class302.totalPoints).toBe(350); // 50 participation + 300 runnerUp
  });

  it('should award bronze medal for 3rd place match', () => {
    const matches: MatchItem[] = [
      {
        id: 'bronze-1',
        sport: 'basketball',
        matchType: 'tournament',
        title: '농구 3,4위전',
        round: '3,4위전',
        tournamentSlot: 'BRONZE',
        homeTeam: '2-1반',
        awayTeam: '2-2반',
        homeClass: '201',
        awayClass: '202',
        homeScore: 40,
        awayScore: 30,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 1200,
        timerRunning: false,
        startTime: '2026-09-08T13:00:00Z',
        court: '체육관 1층',
        events: [],
        updatedAt: '2026-09-08T14:00:00Z'
      }
    ];

    const standings = calculateClassStandings(matches);
    const class201 = standings.find((s) => s.classId === '201')!;

    expect(class201.bronzeCount).toBe(1);
    expect(class201.totalPoints).toBe(200); // 50 participation + 150 thirdPlace
  });

  it('should apply tie-breaking rules correctly (Points -> Gold -> Silver -> Bronze)', () => {
    const matches: MatchItem[] = [
      // 101 gets a gold medal (550 points)
      {
        id: 'f1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '축구 결승전',
        round: '결승전',
        tournamentSlot: 'FINAL',
        homeTeam: '1-1반',
        awayTeam: '1-2반',
        homeClass: '101',
        awayClass: '102',
        homeScore: 1,
        awayScore: 0,
        status: 'FINISHED',
        period: '종료',
        elapsedSeconds: 2400,
        timerRunning: false,
        startTime: '2026-09-08T14:00:00Z',
        court: '대운동장 A',
        events: [],
        updatedAt: '2026-09-08T15:00:00Z'
      }
    ];

    const standings = calculateClassStandings(matches);

    expect(standings[0].classId).toBe('101');
    expect(standings[0].rank).toBe(1);
    expect(standings[0].awardTitle).toBe('🏆 종합 우승');

    expect(standings[1].classId).toBe('102');
    expect(standings[1].rank).toBe(2);
    expect(standings[1].awardTitle).toBe('🥈 종합 준우승');
  });
});
