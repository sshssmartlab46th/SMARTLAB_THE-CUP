import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchItem } from '../types';
import {
  extractMatchScorers,
  getMatchSummaryDetails,
  formatMatchSummaryText,
  drawMatchResultCardOnCanvas,
  generateMatchResultCardDataUrl
} from './matchResultCardGenerator';

describe('matchResultCardGenerator Utility', () => {
  const sampleMatch: MatchItem = {
    id: 'match-101',
    sport: 'soccer',
    matchType: 'tournament',
    title: '축구 8강 1경기',
    round: '8강 1경기',
    homeTeam: '1-1 (청룡)',
    awayTeam: '1-2 (백호)',
    homeClass: '101',
    awayClass: '102',
    homeScore: 2,
    awayScore: 1,
    status: 'FINISHED',
    period: '종료',
    elapsedSeconds: 2400,
    timerRunning: false,
    startTime: '2026-09-08T10:00:00.000Z',
    court: '대운동장 A',
    mvpWinner: '20105 김철수',
    updatedAt: '2026-09-08T10:40:00.000Z',
    events: [
      {
        id: 'evt-1',
        minute: 12,
        type: 'GOAL',
        team: 'home',
        player: '20105 김철수',
        description: '필드골 득점',
        timestamp: '2026-09-08T10:12:00.000Z'
      },
      {
        id: 'evt-2',
        minute: 28,
        type: 'GOAL',
        team: 'away',
        player: '20210 이영희',
        description: '페널티킥 득점',
        timestamp: '2026-09-08T10:28:00.000Z'
      },
      {
        id: 'evt-3',
        minute: 38,
        type: 'GOAL',
        team: 'home',
        player: '20105 김철수',
        description: '헤더골 득점',
        timestamp: '2026-09-08T10:38:00.000Z'
      }
    ]
  };

  it('extracts home and away scorers grouped by player', () => {
    const { homeScorers, awayScorers } = extractMatchScorers(sampleMatch);

    expect(homeScorers).toHaveLength(1);
    expect(homeScorers[0].player).toBe('20105 김철수');
    expect(homeScorers[0].details).toEqual(["12'", "38'"]);

    expect(awayScorers).toHaveLength(1);
    expect(awayScorers[0].player).toBe('20210 이영희');
    expect(awayScorers[0].details).toEqual(["28'"]);
  });

  it('handles matches without events or scorers gracefully', () => {
    const emptyMatch: MatchItem = {
      ...sampleMatch,
      events: []
    };

    const { homeScorers, awayScorers } = extractMatchScorers(emptyMatch);
    expect(homeScorers).toHaveLength(0);
    expect(awayScorers).toHaveLength(0);
  });

  it('returns structured summary details with MVP and penalty shootout scores', () => {
    const penaltyMatch: MatchItem = {
      ...sampleMatch,
      homeScore: 1,
      awayScore: 1,
      penaltyShootout: {
        isActive: false,
        homeScore: 4,
        awayScore: 3,
        homeKicks: [],
        awayKicks: [],
        completedAt: '2026-09-08T10:45:00.000Z'
      }
    };

    const details = getMatchSummaryDetails(penaltyMatch);
    expect(details.homeScore).toBe(1);
    expect(details.awayScore).toBe(1);
    expect(details.homePenaltyScore).toBe(4);
    expect(details.awayPenaltyScore).toBe(3);
    expect(details.mvpWinner).toBe('20105 김철수');
    expect(details.sportName).toBe('축구');
  });

  it('formats match summary text correctly including made by SMARTLAB branding', () => {
    const formattedText = formatMatchSummaryText(sampleMatch);

    expect(formattedText).toContain('🏆 [상산제 체육대회 경기 결과]');
    expect(formattedText).toContain('⚽ 1-1 (청룡) 2 : 1 1-2 (백호)');
    expect(formattedText).toContain('• 1-1 (청룡): 20105 김철수 (12\', 38\')');
    expect(formattedText).toContain('🌟 MVP: 20105 김철수');
    expect(formattedText).toContain('made by SMARTLAB');
  });

  it('draws on canvas without throwing exceptions', () => {
    const mockContext = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      getContext: vi.fn()
    };

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
    } as unknown as HTMLCanvasElement;

    drawMatchResultCardOnCanvas(canvas, sampleMatch);

    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(675);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });
});
