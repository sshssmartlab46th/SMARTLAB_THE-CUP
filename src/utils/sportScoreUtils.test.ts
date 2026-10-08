import { describe, it, expect } from 'vitest';
import {
  getSportScoreMeta,
  getTimelineEventDisplay,
  formatScoreActionText
} from './sportScoreUtils';
import { TimelineEvent } from '../types';

describe('sportScoreUtils', () => {
  describe('getSportScoreMeta', () => {
    it('returns soccer config by default when sport is undefined or empty', () => {
      const defaultMeta = getSportScoreMeta();
      expect(defaultMeta.sport).toBe('soccer');
      expect(defaultMeta.scoreUnit).toBe('골');

      const emptyMeta = getSportScoreMeta('');
      expect(emptyMeta.sport).toBe('soccer');
    });

    it('returns specific metadata for exact sport keys', () => {
      expect(getSportScoreMeta('soccer').sport).toBe('soccer');
      expect(getSportScoreMeta('basketball').sport).toBe('basketball');
      expect(getSportScoreMeta('dodgeball').sport).toBe('dodgeball');
      expect(getSportScoreMeta('tug_of_war').sport).toBe('tug_of_war');
      expect(getSportScoreMeta('relay_male').sport).toBe('relay_male');
      expect(getSportScoreMeta('relay_female').sport).toBe('relay_female');
    });

    it('handles Korean sport names and substring keywords', () => {
      expect(getSportScoreMeta('농구').sport).toBe('basketball');
      expect(getSportScoreMeta('피구').sport).toBe('dodgeball');
      expect(getSportScoreMeta('줄다리기').sport).toBe('tug_of_war');
      expect(getSportScoreMeta('계주').sport).toBe('relay_male');
      expect(getSportScoreMeta('달리기').sport).toBe('relay_male');
    });

    it('trims whitespace and ignores letter casing', () => {
      expect(getSportScoreMeta('  BASKETBALL  ').sport).toBe('basketball');
      expect(getSportScoreMeta('SOCCER').sport).toBe('soccer');
    });

    it('falls back to soccer for unknown sport strings', () => {
      const unknown = getSportScoreMeta('unknown_sport_type');
      expect(unknown.sport).toBe('soccer');
      expect(unknown.scoreUnit).toBe('골');
    });
  });

  describe('getTimelineEventDisplay', () => {
    const baseTimestamp = '2026-09-15T10:00:00.000Z';

    it('formats POINT_3 events correctly', () => {
      const evt: TimelineEvent = {
        id: 'e1',
        minute: 5,
        type: 'POINT_3',
        team: 'home',
        player: '선수A',
        description: '3점 성공',
        timestamp: baseTimestamp
      };
      const display = getTimelineEventDisplay(evt, 'basketball');
      expect(display.icon).toBe('🏀');
      expect(display.badgeLabel).toBe('3점슛 (+3점)');
      expect(display.badgeClass).toContain('bg-orange-600');
    });

    it('formats POINT_2 events correctly', () => {
      const evt: TimelineEvent = {
        id: 'e2',
        minute: 10,
        type: 'POINT_2',
        team: 'home',
        player: '선수B',
        description: '2점 성공',
        timestamp: baseTimestamp
      };
      const display = getTimelineEventDisplay(evt, 'basketball');
      expect(display.icon).toBe('🏀');
      expect(display.badgeLabel).toBe('2점슛 (+2점)');
      expect(display.badgeClass).toContain('bg-amber-600');
    });

    it('formats FREE_THROW events correctly', () => {
      const evt: TimelineEvent = {
        id: 'e3',
        minute: 12,
        type: 'FREE_THROW',
        team: 'away',
        player: '선수C',
        description: '자유투 성공',
        timestamp: baseTimestamp
      };
      const display = getTimelineEventDisplay(evt, 'basketball');
      expect(display.icon).toBe('🏀');
      expect(display.badgeLabel).toBe('자유투 (+1점)');
      expect(display.badgeClass).toContain('bg-blue-600');
    });

    it('formats OUT events correctly for dodgeball', () => {
      const evt: TimelineEvent = {
        id: 'e4',
        minute: 3,
        type: 'OUT',
        team: 'home',
        player: '선수D',
        description: '공격 성공',
        timestamp: baseTimestamp
      };
      const display = getTimelineEventDisplay(evt, 'dodgeball');
      expect(display.icon).toBe('🏐');
      expect(display.badgeLabel).toBe('아웃 (+1점)');
      expect(display.badgeClass).toContain('bg-indigo-600');
    });

    it('formats GOAL events correctly according to sport', () => {
      const soccerGoal: TimelineEvent = {
        id: 'e5',
        minute: 15,
        type: 'GOAL',
        team: 'home',
        player: '선수E',
        description: '필드골',
        timestamp: baseTimestamp
      };
      const soccerDisplay = getTimelineEventDisplay(soccerGoal, 'soccer');
      expect(soccerDisplay.icon).toBe('⚽');
      expect(soccerDisplay.badgeLabel).toBe('골 (+1골)');

      const tugGoal: TimelineEvent = {
        id: 'e6',
        minute: 2,
        type: 'GOAL',
        team: 'away',
        player: '선수F',
        description: '세트 승리',
        timestamp: baseTimestamp
      };
      const tugDisplay = getTimelineEventDisplay(tugGoal, 'tug_of_war');
      expect(tugDisplay.icon).toBe('🪢');
      expect(tugDisplay.badgeLabel).toBe('세트 승리 (+1승)');
    });

    it('formats card and substitution events', () => {
      const yellowCard: TimelineEvent = {
        id: 'e7',
        minute: 20,
        type: 'YELLOW_CARD',
        team: 'home',
        player: '선수G',
        description: '파울 경고',
        timestamp: baseTimestamp
      };
      expect(getTimelineEventDisplay(yellowCard).badgeLabel).toBe('경고');
      expect(getTimelineEventDisplay(yellowCard).icon).toBe('🟨');

      const redCard: TimelineEvent = {
        id: 'e8',
        minute: 25,
        type: 'RED_CARD',
        team: 'away',
        player: '선수H',
        description: '퇴장 처리',
        timestamp: baseTimestamp
      };
      expect(getTimelineEventDisplay(redCard).badgeLabel).toBe('퇴장');
      expect(getTimelineEventDisplay(redCard).icon).toBe('🟥');

      const sub: TimelineEvent = {
        id: 'e9',
        minute: 30,
        type: 'SUBSTITUTION',
        team: 'home',
        player: '선수I',
        description: '선수 교체',
        timestamp: baseTimestamp
      };
      expect(getTimelineEventDisplay(sub).badgeLabel).toBe('선수 교체');
      expect(getTimelineEventDisplay(sub).icon).toBe('🔄');
    });

    it('provides fallback display for unknown custom event types', () => {
      const customEvt: TimelineEvent = {
        id: 'e10',
        minute: 1,
        type: 'CUSTOM_TIMEOUT' as any,
        team: 'home',
        player: '감독',
        description: '타임아웃',
        points: 2,
        timestamp: baseTimestamp
      };
      const display = getTimelineEventDisplay(customEvt, 'basketball');
      expect(display.badgeLabel).toBe('+2점');
    });
  });

  describe('formatScoreActionText', () => {
    it('formats score action text for soccer', () => {
      const text = formatScoreActionText('soccer', '1-1반', '김철수', 15, '필드골', 1);
      expect(text).toBe('1-1반 김철수 선수 15분 골 (필드골)');
    });

    it('formats score action text for basketball', () => {
      const text = formatScoreActionText('basketball', '2-3반', '이영희', 8, '3점슛', 3);
      expect(text).toBe('2-3반 이영희 선수 8분 3점슛 (+3점)');
    });

    it('formats score action text for dodgeball', () => {
      const text = formatScoreActionText('dodgeball', '3-5반', '박민수', 4, '공격 아웃', 1);
      expect(text).toBe('3-5반 박민수 선수 4분 공격 아웃 (+1점)');
    });

    it('formats score action text for other sports with custom units', () => {
      const text = formatScoreActionText('tug_of_war', '1-2반', '팀A', 2, '세트 승리', 1);
      expect(text).toBe('1-2반 팀A 선수 2분 세트 승리 (+1승)');
    });
  });
});
