import { MatchItem, SportType, TimelineEvent } from '../types';
import { syncCompletedTournamentRounds } from './firebase/firebaseMatches';

const MOCK_REHEARSAL_PREFIX = 'rehearsal-sim-';
const REHEARSAL_BACKUP_KEY = 'sangsan_rehearsal_prod_matches_backup';

export interface SimulationLogEntry {
  id: string;
  timestamp: string;
  matchTitle: string;
  sport: SportType;
  grade: string;
  action: string;
  detail: string;
}

const SAMPLE_PLAYERS: Record<string, string[]> = {
  '1': ['10101 김서준', '10105 이민준', '10203 박도윤', '10208 최시우', '10302 정예준', '10405 강현우'],
  '2': ['20102 윤지호', '20109 임성민', '20305 김민준', '20311 박서준', '20404 송우진', '20501 오동현'],
  '3': ['30101 이준혁', '30107 최재민', '30205 김도현', '30302 한지훈', '30408 백승우', '30503 서건우']
};

/**
 * Generate a complete set of mock matches for all grades and sports for tournament rehearsal.
 */
export function generateMockRehearsalMatches(): MatchItem[] {
  const now = new Date();
  const isoNow = now.toISOString();

  const sports: { sport: SportType; titleSuffix: string; court: string }[] = [
    { sport: 'soccer', titleSuffix: '축구 대진', court: '대운동장 A' },
    { sport: 'basketball', titleSuffix: '농구 대진', court: '체육관 B' },
    { sport: 'dodgeball', titleSuffix: '피구 대진', court: '우레탄 구장' },
    { sport: 'tug_of_war', titleSuffix: '줄다리기 대진', court: '대운동장 메인' },
    { sport: 'relay_male', titleSuffix: '남자 계주', court: '대운동장 트랙' }
  ];

  const mockList: MatchItem[] = [];

  ['1', '2', '3'].forEach((grade) => {
    sports.forEach(({ sport, titleSuffix, court }) => {
      // 8강 1~4경기
      const qfSlots = [
        { slot: 'QF1', roundName: '8강 1경기', home: `${grade}-1반`, away: `${grade}-2반`, homeClass: `${grade}01`, awayClass: `${grade}02` },
        { slot: 'QF2', roundName: '8강 2경기', home: `${grade}-3반`, away: `${grade}-4반`, homeClass: `${grade}03`, awayClass: `${grade}04` },
        { slot: 'QF3', roundName: '8강 3경기', home: `${grade}-5반`, away: `${grade}-6반`, homeClass: `${grade}05`, awayClass: `${grade}06` },
        { slot: 'QF4', roundName: '8강 4경기', home: `${grade}-7반`, away: `${grade}-8반`, homeClass: `${grade}07`, awayClass: `${grade}08` }
      ] as const;

      qfSlots.forEach((qf, idx) => {
        const isFirstLive = grade === '2' && sport === 'soccer' && idx === 0;
        const isFirstFinished = grade === '2' && sport === 'soccer' && idx === 1;

        mockList.push({
          id: `${MOCK_REHEARSAL_PREFIX}${grade}-${sport}-${qf.slot}`,
          sport,
          matchType: 'tournament',
          title: `[리허설] ${grade}학년 ${titleSuffix} ${qf.roundName}`,
          round: qf.roundName,
          homeTeam: qf.home,
          awayTeam: qf.away,
          homeClass: qf.homeClass,
          awayClass: qf.awayClass,
          homeScore: isFirstFinished ? 3 : isFirstLive ? 1 : 0,
          awayScore: isFirstFinished ? 1 : isFirstLive ? 0 : 0,
          status: isFirstFinished ? 'FINISHED' : isFirstLive ? 'LIVE' : 'SCHEDULED',
          period: isFirstFinished ? '경기 종료' : isFirstLive ? '전반전' : '경기전',
          elapsedSeconds: isFirstLive ? 420 : 0,
          timerRunning: isFirstLive,
          startTime: isoNow,
          court,
          tournamentSlot: qf.slot,
          events: isFirstLive ? [
            {
              id: `sim-evt-1`,
              minute: 5,
              type: 'GOAL',
              team: 'home',
              player: '20102 윤지호',
              description: '2-1반 윤지호 선수의 리허설 선제골',
              timestamp: isoNow
            }
          ] : [],
          updatedAt: isoNow
        });
      });

      // 4강 1~2경기 (Wait for QF winners or initial placeholder)
      const sfSlots = [
        { slot: 'SF1', roundName: '4강 1경기', home: `${grade}학년 8강 1G 승자`, away: `${grade}학년 8강 2G 승자` },
        { slot: 'SF2', roundName: '4강 2경기', home: `${grade}학년 8강 3G 승자`, away: `${grade}학년 8강 4G 승자` }
      ] as const;

      sfSlots.forEach((sf) => {
        mockList.push({
          id: `${MOCK_REHEARSAL_PREFIX}${grade}-${sport}-${sf.slot}`,
          sport,
          matchType: 'tournament',
          title: `[리허설] ${grade}학년 ${titleSuffix} ${sf.roundName}`,
          round: sf.roundName,
          homeTeam: sf.home,
          awayTeam: sf.away,
          homeClass: 'TBD',
          awayClass: 'TBD',
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          period: '경기전',
          elapsedSeconds: 0,
          timerRunning: false,
          startTime: isoNow,
          court,
          tournamentSlot: sf.slot,
          events: [],
          updatedAt: isoNow
        });
      });

      // 결승전
      mockList.push({
        id: `${MOCK_REHEARSAL_PREFIX}${grade}-${sport}-FINAL`,
        sport,
        matchType: 'tournament',
        title: `[리허설] ${grade}학년 ${titleSuffix} 결승전`,
        round: '결승전',
        homeTeam: `${grade}학년 4강 1G 승자`,
        awayTeam: `${grade}학년 4강 2G 승자`,
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        elapsedSeconds: 0,
        timerRunning: false,
        startTime: isoNow,
        court,
        tournamentSlot: 'FINAL',
        events: [],
        updatedAt: isoNow
      });
    });
  });

  return mockList;
}

/**
 * Simulate a single random match event (score, goal, status shift)
 */
export function simulateRandomMatchStep(matches: MatchItem[]): {
  updatedMatches: MatchItem[];
  log: SimulationLogEntry | null;
} {
  const currentList = matches.map((m) => ({ ...m, events: [...(m.events || [])] }));

  // Find LIVE or SCHEDULED matches
  let candidateIndex = currentList.findIndex((m) => m.status === 'LIVE' && m.id.startsWith(MOCK_REHEARSAL_PREFIX));

  if (candidateIndex === -1) {
    candidateIndex = currentList.findIndex(
      (m) => m.status === 'SCHEDULED' && !m.homeTeam.includes('승자') && m.id.startsWith(MOCK_REHEARSAL_PREFIX)
    );
  }

  if (candidateIndex === -1) {
    return { updatedMatches: currentList, log: null };
  }

  const target = currentList[candidateIndex];
  const grade = target.homeClass?.charAt(0) || '2';
  const playerList = SAMPLE_PLAYERS[grade] || SAMPLE_PLAYERS['2'];
  const randomPlayer = playerList[Math.floor(Math.random() * playerList.length)];
  const teamChoice: 'home' | 'away' = Math.random() > 0.5 ? 'home' : 'away';
  const teamName = teamChoice === 'home' ? target.homeTeam : target.awayTeam;

  const nowStr = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  const isoNow = new Date().toISOString();

  if (target.status === 'SCHEDULED') {
    // Start match
    target.status = 'LIVE';
    target.period = target.sport === 'soccer' ? '전반전' : '1세트';
    target.timerRunning = true;
    target.elapsedSeconds = 60;
    target.updatedAt = isoNow;

    const log: SimulationLogEntry = {
      id: `sim-log-${Date.now()}`,
      timestamp: nowStr,
      matchTitle: target.title,
      sport: target.sport,
      grade,
      action: '경기 시작 (KICK OFF)',
      detail: `${target.homeTeam} VS ${target.awayTeam} 시뮬레이션 경기가 시작되었습니다.`
    };

    return { updatedMatches: currentList, log };
  }

  // If LIVE: generate goal/score event
  const pointsAdd = target.sport === 'basketball' ? (Math.random() > 0.3 ? 2 : 3) : 1;

  if (teamChoice === 'home') {
    target.homeScore = (target.homeScore || 0) + pointsAdd;
  } else {
    target.awayScore = (target.awayScore || 0) + pointsAdd;
  }

  target.elapsedSeconds = (target.elapsedSeconds || 0) + 120;
  const currMinute = Math.max(1, Math.floor(target.elapsedSeconds / 60));

  const newEvent: TimelineEvent = {
    id: `sim-evt-${Date.now()}`,
    minute: currMinute,
    type: pointsAdd === 3 ? 'POINT_3' : pointsAdd === 2 ? 'POINT_2' : 'GOAL',
    team: teamChoice,
    player: randomPlayer,
    description: `${teamName} ${randomPlayer} ${pointsAdd}점/득점 (리허설)`,
    points: pointsAdd,
    timestamp: isoNow
  };

  target.events.unshift(newEvent);
  target.updatedAt = isoNow;

  const log: SimulationLogEntry = {
    id: `sim-log-${Date.now()}`,
    timestamp: nowStr,
    matchTitle: target.title,
    sport: target.sport,
    grade,
    action: `득점 발생 (+${pointsAdd}점)`,
    detail: `${teamName} (${randomPlayer}) - 현재 스코어 ${target.homeScore}:${target.awayScore}`
  };

  return { updatedMatches: currentList, log };
}

/**
 * Simulate completing an entire round (e.g. all 8-gang matches) for a sport and grade
 */
export async function simulateCompleteRound(
  matches: MatchItem[],
  grade: string,
  sport: SportType,
  roundSlot: 'QF' | 'SF'
): Promise<{ updatedMatches: MatchItem[]; logs: string[] }> {
  const currentList = matches.map((m) => ({ ...m, events: [...(m.events || [])] }));

  const targetMatches = currentList.filter((m) => {
    if (m.sport !== sport) return false;
    const matchGrade = m.homeClass?.charAt(0) || '1';
    if (matchGrade !== grade) return false;
    const slot = m.tournamentSlot || '';
    if (roundSlot === 'QF') return slot.startsWith('QF');
    if (roundSlot === 'SF') return slot.startsWith('SF');
    return false;
  });

  const logs: string[] = [];

  targetMatches.forEach((m, idx) => {
    if (m.status !== 'FINISHED') {
      m.status = 'FINISHED';
      m.period = '경기 종료';
      m.timerRunning = false;
      // Guarantee a non-tied score so a clear winner is determined
      m.homeScore = 2 + idx;
      m.awayScore = 1;
      m.updatedAt = new Date().toISOString();
      logs.push(`[시뮬레이션 완료] ${m.title}: ${m.homeTeam} (${m.homeScore}) vs ${m.awayTeam} (${m.awayScore})`);
    }
  });

  // Execute automatic tournament round sync
  const syncRes = await syncCompletedTournamentRounds(currentList);
  logs.push(...syncRes.logs);

  return { updatedMatches: currentList, logs };
}

/**
 * Backup real production match dataset before enabling rehearsal
 */
export function saveRehearsalBackup(prodMatches: MatchItem[]): void {
  try {
    const nonRehearsal = prodMatches.filter((m) => !m.id.startsWith(MOCK_REHEARSAL_PREFIX));
    localStorage.setItem(REHEARSAL_BACKUP_KEY, JSON.stringify(nonRehearsal));
  } catch (e) {
    console.warn('[Rehearsal] Failed to save backup to localStorage:', e);
  }
}

/**
 * Load production match dataset backup
 */
export function loadRehearsalBackup(): MatchItem[] | null {
  try {
    const json = localStorage.getItem(REHEARSAL_BACKUP_KEY);
    if (!json) return null;
    return JSON.parse(json) as MatchItem[];
  } catch (e) {
    console.warn('[Rehearsal] Failed to load backup from localStorage:', e);
    return null;
  }
}

/**
 * Clear production match dataset backup
 */
export function clearRehearsalBackup(): void {
  try {
    localStorage.removeItem(REHEARSAL_BACKUP_KEY);
  } catch (e) {
    console.warn('[Rehearsal] Failed to clear backup:', e);
  }
}
