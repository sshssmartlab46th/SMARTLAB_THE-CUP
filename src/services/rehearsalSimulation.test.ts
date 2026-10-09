import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateMockRehearsalMatches,
  simulateRandomMatchStep,
  simulateCompleteRound,
  saveRehearsalBackup,
  loadRehearsalBackup,
  clearRehearsalBackup
} from './rehearsalSimulationService';
import { MatchItem } from '../types';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe('Rehearsal Simulation Service', () => {
  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('generates mock rehearsal matches across all grades and sports', () => {
    const matches = generateMockRehearsalMatches();
    expect(matches.length).toBeGreaterThan(30);

    const rehearsalMatches = matches.filter((m) => m.id.startsWith('rehearsal-sim-'));
    expect(rehearsalMatches.length).toBe(matches.length);

    // Check presence of 1st, 2nd, 3rd grade matches
    const grade1Matches = matches.filter((m) => m.id.includes('-1-'));
    const grade2Matches = matches.filter((m) => m.id.includes('-2-'));
    const grade3Matches = matches.filter((m) => m.id.includes('-3-'));

    expect(grade1Matches.length).toBeGreaterThan(0);
    expect(grade2Matches.length).toBeGreaterThan(0);
    expect(grade3Matches.length).toBeGreaterThan(0);
  });

  it('simulates a random match step correctly', () => {
    const mockMatches = generateMockRehearsalMatches();
    const { updatedMatches, log } = simulateRandomMatchStep(mockMatches);

    expect(updatedMatches).toBeDefined();
    expect(log).not.toBeNull();
    expect(log?.matchTitle).toBeDefined();
  });

  it('simulates completing an entire 8-gang round and automatically advances winners to 4-gang', async () => {
    const mockMatches = generateMockRehearsalMatches();

    const { updatedMatches, logs } = await simulateCompleteRound(mockMatches, '2', 'soccer', 'QF');

    expect(updatedMatches).toBeDefined();
    expect(logs.length).toBeGreaterThan(0);

    // Verify 8-gang matches are finished
    const qfMatches = updatedMatches.filter(
      (m) => m.id.startsWith('rehearsal-sim-2-soccer-QF')
    );
    qfMatches.forEach((m) => {
      expect(m.status).toBe('FINISHED');
    });

    // Verify 4-gang matches got updated with 8-gang winners
    const sf1 = updatedMatches.find((m) => m.id === 'rehearsal-sim-2-soccer-SF1');
    const sf2 = updatedMatches.find((m) => m.id === 'rehearsal-sim-2-soccer-SF2');

    expect(sf1?.homeTeam).not.toContain('승자');
    expect(sf1?.awayTeam).not.toContain('승자');
    expect(sf2?.homeTeam).not.toContain('승자');
    expect(sf2?.awayTeam).not.toContain('승자');
  });

  it('backs up, loads, and clears production match datasets correctly', () => {
    const prodMatches: MatchItem[] = [
      {
        id: 'prod-match-101',
        sport: 'soccer',
        matchType: 'tournament',
        title: '실제 축구 8강 1경기',
        round: '8강 1경기',
        homeTeam: '2-1반',
        awayTeam: '2-2반',
        homeClass: '201',
        awayClass: '202',
        homeScore: 1,
        awayScore: 0,
        status: 'LIVE',
        period: '전반전',
        elapsedSeconds: 300,
        timerRunning: true,
        startTime: new Date().toISOString(),
        court: '대운동장 A',
        events: [],
        updatedAt: new Date().toISOString()
      }
    ];

    saveRehearsalBackup(prodMatches);

    const loaded = loadRehearsalBackup();
    expect(loaded).not.toBeNull();
    expect(loaded?.length).toBe(1);
    expect(loaded?.[0].id).toBe('prod-match-101');

    clearRehearsalBackup();
    expect(loadRehearsalBackup()).toBeNull();
  });
});
