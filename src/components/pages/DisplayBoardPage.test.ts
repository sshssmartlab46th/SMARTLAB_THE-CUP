import { describe, it, expect } from 'vitest';
import { MatchItem, ClassStandingItem, CheerCount } from '../../types';

// Display Board Logic Helper functions for unit testing
export function calculateCheerPercentages(cheerData: CheerCount) {
  const totalCheers = cheerData.homeCheers + cheerData.awayCheers;
  const homePercent = totalCheers > 0 ? Math.round((cheerData.homeCheers / totalCheers) * 100) : 50;
  const awayPercent = totalCheers > 0 ? 100 - homePercent : 50;
  return { totalCheers, homePercent, awayPercent };
}

export function formatBoardTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getTopBoardStandings(standings: ClassStandingItem[], maxCount: number = 8): ClassStandingItem[] {
  return standings.slice(0, maxCount);
}

export function selectLiveOrFirstMatch(matches: MatchItem[], selectedId?: string): MatchItem | null {
  if (selectedId) {
    const matched = matches.find((m) => m.id === selectedId);
    if (matched) return matched;
  }
  return matches.find((m) => m.status === 'LIVE' || m.status === 'PAUSED') ||
    matches.find((m) => m.status === 'SCHEDULED') ||
    matches[0] ||
    null;
}

describe('DisplayBoardPage Data Processing Helpers', () => {
  const mockMatches: MatchItem[] = [
    {
      id: 'm1',
      sport: 'soccer',
      matchType: 'tournament',
      title: '축구 준결승 1경기',
      round: '4강 1경기',
      homeTeam: '3-1 (청룡)',
      awayTeam: '3-2 (백호)',
      homeClass: '301',
      awayClass: '302',
      homeScore: 2,
      awayScore: 1,
      status: 'FINISHED',
      period: '종료',
      elapsedSeconds: 2400,
      timerRunning: false,
      startTime: new Date().toISOString(),
      court: '대운동장',
      events: [],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'm2',
      sport: 'soccer',
      matchType: 'tournament',
      title: '축구 결승전',
      round: '결승전',
      homeTeam: '3-2 (백호)',
      awayTeam: '3-5 (주작)',
      homeClass: '302',
      awayClass: '305',
      homeScore: 1,
      awayScore: 0,
      status: 'LIVE',
      period: '전반전',
      elapsedSeconds: 780,
      timerRunning: true,
      startTime: new Date().toISOString(),
      court: '대운동장 메인 코트',
      events: [],
      updatedAt: new Date().toISOString()
    }
  ];

  const mockStandings: ClassStandingItem[] = [
    { id: '302', rank: 1, classLabel: '3-2반', points: 500, grade: '3', classNum: '2' },
    { id: '305', rank: 2, classLabel: '3-5반', points: 300, grade: '3', classNum: '5' },
    { id: '301', rank: 3, classLabel: '3-1반', points: 200, grade: '3', classNum: '1' }
  ];

  it('correctly calculates cheer gauge percentages for home and away teams', () => {
    const cheerData: CheerCount = { matchId: 'm2', homeCheers: 120, awayCheers: 80 };
    const { totalCheers, homePercent, awayPercent } = calculateCheerPercentages(cheerData);

    expect(totalCheers).toBe(200);
    expect(homePercent).toBe(60);
    expect(awayPercent).toBe(40);
  });

  it('handles 0 cheers safely with 50/50 balance', () => {
    const cheerData: CheerCount = { matchId: 'm2', homeCheers: 0, awayCheers: 0 };
    const { totalCheers, homePercent, awayPercent } = calculateCheerPercentages(cheerData);

    expect(totalCheers).toBe(0);
    expect(homePercent).toBe(50);
    expect(awayPercent).toBe(50);
  });

  it('formats elapsed timer seconds into mm:ss display format', () => {
    expect(formatBoardTimer(780)).toBe('13:00');
    expect(formatBoardTimer(45)).toBe('00:45');
    expect(formatBoardTimer(0)).toBe('00:00');
  });

  it('selects live match automatically when no selection is specified', () => {
    const selected = selectLiveOrFirstMatch(mockMatches);
    expect(selected?.id).toBe('m2');
    expect(selected?.status).toBe('LIVE');
  });

  it('selects requested match ID if provided', () => {
    const selected = selectLiveOrFirstMatch(mockMatches, 'm1');
    expect(selected?.id).toBe('m1');
    expect(selected?.title).toBe('축구 준결승 1경기');
  });

  it('slices top standings up to specified maximum for display board', () => {
    const top = getTopBoardStandings(mockStandings, 2);
    expect(top.length).toBe(2);
    expect(top[0].classLabel).toBe('3-2반');
    expect(top[1].classLabel).toBe('3-5반');
  });
});
