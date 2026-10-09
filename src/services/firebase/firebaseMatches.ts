import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  deleteDoc,
  where,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  increment,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { realtimeWsClient } from '../realtimeWsClient';
import {
  MatchItem,
  MatchReminderItem,
  SportType,
  TimelineEvent,
  LiveCommentaryItem,
  UserProfile
} from '../../types';
import { createAndSaveAuditLog } from '../../utils/auditLogger';
import { ensureFirebaseAuth, handleFirestoreError, OperationType, sanitizeFirestorePayload } from './firebaseCore';
import { getLocalUsersRegistry } from './firebaseAuth';
import {
  KST_TIMEZONE,
  parseMatchStartTimeKST,
  formatKSTTime,
  formatKSTDate,
  formatKSTDateTime,
  toKSTIsoString,
  parseKSTDateAndTime,
  getKSTNowParts
} from '../../utils/kstTime';
import { getSportScoreMeta, formatScoreActionText } from '../../utils/sportScoreUtils';

export function listenMatches(callback: (matches: MatchItem[]) => void): () => void {
  let firestoreUnsub: (() => void) | null = null;
  let hasReceivedData = false;

  const wrappedCallback = (matches: MatchItem[]) => {
    hasReceivedData = true;
    const filtered = matches.filter((m) => (m.sport as string) !== 'group_rope');
    callback(filtered);
  };

  // 1. Subscribe via WebSocket relay
  const wsUnsub = realtimeWsClient.subscribeMatches(wrappedCallback);

  // 2. Start direct Firestore onSnapshot as fallback if WS is not active or fails
  const startFirestoreFallback = () => {
    if (firestoreUnsub) return;
    try {
      ensureFirebaseAuth().catch(console.error);
      const q = collection(db, 'matches');
      firestoreUnsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: MatchItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if ((data.sport as string) !== 'group_rope') {
              list.push({
                ...data,
                id: docSnap.id
              } as MatchItem);
            }
          });
          callback(list);
        } else {
          callback([]);
        }
      }, (error) => {
        console.warn('[Firebase] listenMatches fallback error:', error);
        callback([]);
      });
    } catch (e) {
      console.warn('[Firebase] listenMatches fallback init error:', e);
    }
  };

  // Check WS status; if disconnected or fallback mode, start Firestore listener
  const statusUnsub = realtimeWsClient.subscribeStatus((connected) => {
    if (connected) {
      if (firestoreUnsub) {
        firestoreUnsub();
        firestoreUnsub = null;
      }
    } else {
      startFirestoreFallback();
    }
  });

  // Safety timer: if WS doesn't deliver initial data within 2.5s, trigger Firestore
  const fallbackTimer = setTimeout(() => {
    if (!realtimeWsClient.isWsActive() && !hasReceivedData) {
      startFirestoreFallback();
    }
  }, 2500);

  return () => {
    clearTimeout(fallbackTimer);
    wsUnsub();
    statusUnsub();
    if (firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = null;
    }
  };
}

export async function createMatch(matchData: Partial<MatchItem>): Promise<string> {
  const id = matchData.id || `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, 'matches', id);
  const now = new Date().toISOString();
  const fullMatch: MatchItem = {
    id,
    sport: matchData.sport || 'soccer',
    matchType: matchData.matchType || 'tournament',
    title: matchData.title || '새로운 경기',
    round: matchData.round || '16강',
    court: matchData.court || '대운동장 A',
    status: matchData.status || 'SCHEDULED',
    period: matchData.period || '경기전',
    homeTeam: matchData.homeTeam || '미정',
    awayTeam: matchData.awayTeam || '미정',
    homeClass: matchData.homeClass || '101',
    awayClass: matchData.awayClass || '102',
    homeScore: matchData.homeScore || 0,
    awayScore: matchData.awayScore || 0,
    elapsedSeconds: 0,
    timerRunning: matchData.timerRunning ?? false,
    startTime: matchData.startTime || now,
    events: [],
    updatedAt: now,
    ...matchData
  };
  await setDoc(docRef, sanitizeFirestorePayload(fullMatch));
  return id;
}

export async function updateMatch(matchId: string, partial: Partial<MatchItem>): Promise<void> {
  if (!matchId) return;
  // Skip Firestore network calls for local rehearsal simulation matches
  if (matchId.startsWith('rehearsal-sim-')) {
    return;
  }
  try {
    ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'matches', matchId);
    // Recursively sanitize partial payload to avoid Firestore undefined errors in any nested field
    const sanitized = sanitizeFirestorePayload(partial) as Record<string, any>;
    await updateDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] updateMatch error:', e);
    throw e;
  }
}



export {
  KST_TIMEZONE,
  formatKSTTime,
  formatKSTDate,
  formatKSTDateTime,
  toKSTIsoString,
  parseKSTDateAndTime,
  getKSTNowParts
};

/**
 * Parse any format of match start time into epoch milliseconds anchored strictly in KST (UTC+9)
 */
export function parseMatchStartTime(startTimeStr?: string | null): number | null {
  return parseMatchStartTimeKST(startTimeStr);
}

/**
 * Returns sport-specific starting period name
 */
export function getInitialPeriodForSport(sport?: string): string {
  switch (sport) {
    case 'soccer':
      return '전반전';
    case 'basketball':
      return '1쿼터';
    case 'dodgeball':
      return '1세트';
    case 'relay_male':
    case 'relay_female':
      return '레이스 진행중';
    case 'tug_of_war':
      return '1세트';
    default:
      return '전반전';
  }
}

/**
 * Start a scheduled match: transitions to LIVE and starts the official timer
 */
export async function startMatch(matchId: string, sport?: string): Promise<void> {
  if (!matchId) return;
  const initialPeriod = getInitialPeriodForSport(sport);
  await updateMatch(matchId, {
    status: 'LIVE',
    period: initialPeriod,
    timerRunning: true,
    lastTimerStartedAt: Date.now()
  });
}

/**
 * Pause an active match
 */
export async function pauseMatch(matchId: string): Promise<void> {
  if (!matchId) return;
  await updateMatch(matchId, {
    status: 'PAUSED',
    timerRunning: false
  });
}

/**
 * Resume a paused match
 */
export async function resumeMatch(matchId: string): Promise<void> {
  if (!matchId) return;
  await updateMatch(matchId, {
    status: 'LIVE',
    timerRunning: true,
    lastTimerStartedAt: Date.now()
  });
}

/**
 * Mark a match as finished and automatically synchronize tournament round advancement if an n-gang round completes.
 * If match is soccer and tied without shootout winner, automatically shifts to penalty shootout instead of finishing prematurely.
 */
export async function finishMatch(matchId: string): Promise<void> {
  if (!matchId) return;
  try {
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (matchDoc.exists()) {
      const match = matchDoc.data() as MatchItem;
      const home = Number(match.homeScore) || 0;
      const away = Number(match.awayScore) || 0;

      // 축구 경기이고 무승부이며 아직 승부차기 승자가 결정되지 않았다면 -> 승부차기 모드로 자동 전환!
      if (match.sport === 'soccer' && home === away) {
        const pkHome = Number(match.penaltyShootout?.homeScore) || 0;
        const pkAway = Number(match.penaltyShootout?.awayScore) || 0;
        const pkWinner = match.penaltyShootout?.winner || (
          pkHome !== pkAway ? (pkHome > pkAway ? 'home' : 'away') : null
        );

        if (!pkWinner && !match.penaltyShootout?.isActive) {
          await updateMatch(matchId, {
            status: 'LIVE',
            period: '승부차기',
            timerRunning: false,
            isPenaltyShootout: true,
            penaltyShootout: match.penaltyShootout || {
              isActive: true,
              homeScore: 0,
              awayScore: 0,
              homeKicks: [
                { order: 1, result: 'pending' },
                { order: 2, result: 'pending' },
                { order: 3, result: 'pending' },
                { order: 4, result: 'pending' },
                { order: 5, result: 'pending' }
              ],
              awayKicks: [
                { order: 1, result: 'pending' },
                { order: 2, result: 'pending' },
                { order: 3, result: 'pending' },
                { order: 4, result: 'pending' },
                { order: 5, result: 'pending' }
              ]
            }
          });
          return;
        }

        if (pkWinner && match.penaltyShootout) {
          await updateMatch(matchId, {
            status: 'FINISHED',
            period: '경기 종료 (승부차기)',
            timerRunning: false,
            penaltyShootout: {
              ...match.penaltyShootout,
              isActive: false,
              winner: pkWinner,
              completedAt: new Date().toISOString()
            }
          });
          // Proceed to synchronize completed rounds
          try {
            const q = collection(db, 'matches');
            const snap = await getDocs(q);
            const all: MatchItem[] = [];
            snap.forEach((d) => all.push({ id: d.id, ...d.data() } as MatchItem));
            await syncCompletedTournamentRounds(all);
          } catch (e2) {
            console.error('[Firebase] syncCompletedTournamentRounds after PK finish error:', e2);
          }
          return;
        }
      }
    }

    await updateMatch(matchId, {
      status: 'FINISHED',
      period: '경기 종료',
      timerRunning: false
    });

    // Check if this match finish triggers an n-gang round completion across all sports
    try {
      const q = collection(db, 'matches');
      const snap = await getDocs(q);
      const all: MatchItem[] = [];
      snap.forEach((d) => all.push({ ...d.data(), id: d.id } as MatchItem));
      const idx = all.findIndex((m) => m.id === matchId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], status: 'FINISHED', period: '경기 종료', timerRunning: false };
      }
      const syncRes = await syncCompletedTournamentRounds(all);
      if (syncRes.updatedCount > 0) {
        console.log(`[Tournament Auto-Advance] Round completed! Updated ${syncRes.updatedCount} matches:`, syncRes.logs);
      }
    } catch (autoErr) {
      console.warn('[Tournament Auto-Advance] Post-finish round check warning:', autoErr);
    }
  } catch (e) {
    console.error('[Firebase] finishMatch error:', e);
    throw e;
  }
}

/**
 * Automatically inspects scheduled matches and transitions those whose scheduled start
 * time has arrived or elapsed to 'LIVE' status with their initial period and clock.
 * Ignores placeholder matches (e.g. '8강 1G 승자' / 'TBD').
 */
export async function autoStartDueMatches(matches: MatchItem[]): Promise<MatchItem[]> {
  const now = Date.now();
  const startedMatches: MatchItem[] = [];

  for (const m of matches) {
    if (!m.id || m.status !== 'SCHEDULED' || !m.startTime) continue;

    const timeEpoch = parseMatchStartTime(m.startTime);
    if (!timeEpoch || timeEpoch > now) continue;

    // Skip if teams are still waiting for previous rounds (TBD / 승자 / 패자)
    const isWaitingForPrior =
      (m.homeTeam && (m.homeTeam.includes('승자') || m.homeTeam.includes('패자'))) ||
      (m.awayTeam && (m.awayTeam.includes('승자') || m.awayTeam.includes('패자'))) ||
      m.homeClass === 'TBD' ||
      m.awayClass === 'TBD';

    if (isWaitingForPrior) continue;

    try {
      await startMatch(m.id, m.sport);
      startedMatches.push(m);
    } catch (err) {
      console.error(`[Firebase] autoStartDueMatches failed for match ${m.id}:`, err);
    }
  }

  return startedMatches;
}

export async function deleteMatch(matchId: string): Promise<void> {
  if (!matchId) {
    console.warn('[Firebase] deleteMatch called with empty matchId');
    return;
  }
  try {
    ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'matches', matchId);
    await deleteDoc(docRef);
    console.log('[Firebase] Successfully deleted match document:', matchId);
  } catch (e) {
    console.error('[Firebase] deleteMatch error:', e);
    throw e;
  }
}

export async function batchDeleteMatches(matchIds: string[]): Promise<number> {
  if (!matchIds || matchIds.length === 0) return 0;
  ensureFirebaseAuth().catch(() => {});
  let deletedCount = 0;
  const validIds = matchIds.filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < validIds.length; i += 20) {
    chunks.push(validIds.slice(i, i + 20));
  }
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (id) => {
        try {
          const docRef = doc(db, 'matches', id);
          await deleteDoc(docRef);
          deletedCount++;
        } catch (err) {
          console.error(`[Firebase] Failed to delete match ${id}:`, err);
        }
      })
    );
  }
  return deletedCount;
}



export function getMatchTournamentSlot(m: MatchItem): 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'FINAL' | 'BRONZE' | null {
  if (m.tournamentSlot) return m.tournamentSlot;
  const str = `${m.round || ''} ${m.title || ''}`;
  if (str.includes('8강 1') || str.includes('8강1') || str.includes('준준결승 1') || str.includes('8강 A') || str.includes('8강A') || str.includes('QF1')) return 'QF1';
  if (str.includes('8강 2') || str.includes('8강2') || str.includes('준준결승 2') || str.includes('8강 B') || str.includes('8강B') || str.includes('QF2')) return 'QF2';
  if (str.includes('8강 3') || str.includes('8강3') || str.includes('준준결승 3') || str.includes('8강 C') || str.includes('8강C') || str.includes('QF3')) return 'QF3';
  if (str.includes('8강 4') || str.includes('8강4') || str.includes('준준결승 4') || str.includes('8강 D') || str.includes('8강D') || str.includes('QF4')) return 'QF4';
  if ((str.includes('4강 1') || str.includes('4강1') || str.includes('준결승 1') || str.includes('4강 A') || str.includes('4강A') || str.includes('SF1')) && !str.includes('결승전') && !str.includes('결승')) return 'SF1';
  if ((str.includes('4강 2') || str.includes('4강2') || str.includes('준결승 2') || str.includes('4강 B') || str.includes('4강B') || str.includes('SF2')) && !str.includes('결승전') && !str.includes('결승')) return 'SF2';
  if (str.includes('3·4위') || str.includes('3,4위') || str.includes('3위전') || str.includes('3위 결정전') || str.includes('BRONZE')) return 'BRONZE';
  if (str.includes('결승전') || str.includes('결승') || str.includes('FINAL')) return 'FINAL';
  return null;
}

export function getMatchGrade(m: MatchItem): string {
  if (m.homeClass && m.homeClass.length >= 1 && /^[1-3]/.test(m.homeClass)) {
    return m.homeClass.charAt(0);
  }
  const match = (m.title || '').match(/([1-3])학년/);
  if (match) return match[1];
  const teamMatch = (m.homeTeam || '').match(/([1-3])-(\d+)/);
  if (teamMatch) return teamMatch[1];
  return '1';
}

export function getSportNameKorean(sport: SportType): string {
  switch (sport) {
    case 'soccer': return '축구';
    case 'basketball': return '농구';
    case 'dodgeball': return '피구';
    case 'relay_male': return '남자 계주';
    case 'relay_female': return '여자 계주';
    case 'tug_of_war': return '줄다리기';
    default: return sport;
  }
}

export function getMatchWinner(m: MatchItem): { name: string; classId: string } | null {
  if (m.status !== 'FINISHED') return null;
  const home = Number(m.homeScore) || 0;
  const away = Number(m.awayScore) || 0;
  if (home > away) {
    return { name: m.homeTeam, classId: m.homeClass };
  } else if (away > home) {
    return { name: m.awayTeam, classId: m.awayClass };
  }
  // 무승부 시: 축구 승부차기(Penalty Shootout) 결과로 승자 판별
  if (m.penaltyShootout) {
    const pkHome = Number(m.penaltyShootout.homeScore) || 0;
    const pkAway = Number(m.penaltyShootout.awayScore) || 0;
    if (m.penaltyShootout.winner === 'home' || pkHome > pkAway) {
      return { name: m.homeTeam, classId: m.homeClass };
    } else if (m.penaltyShootout.winner === 'away' || pkAway > pkHome) {
      return { name: m.awayTeam, classId: m.awayClass };
    }
  }
  return null;
}

export function getMatchLoser(m: MatchItem): { name: string; classId: string } | null {
  if (m.status !== 'FINISHED') return null;
  const home = Number(m.homeScore) || 0;
  const away = Number(m.awayScore) || 0;
  if (home > away) {
    return { name: m.awayTeam, classId: m.awayClass };
  } else if (away > home) {
    return { name: m.homeTeam, classId: m.homeClass };
  }
  // 무승부 시: 축구 승부차기(Penalty Shootout) 결과로 패자 판별
  if (m.penaltyShootout) {
    const pkHome = Number(m.penaltyShootout.homeScore) || 0;
    const pkAway = Number(m.penaltyShootout.awayScore) || 0;
    if (m.penaltyShootout.winner === 'home' || pkHome > pkAway) {
      return { name: m.awayTeam, classId: m.awayClass };
    } else if (m.penaltyShootout.winner === 'away' || pkAway > pkHome) {
      return { name: m.homeTeam, classId: m.homeClass };
    }
  }
  return null;
}

export interface RoundCompletionStatus {
  sport: SportType;
  grade: string;
  roundType: 'QF' | 'SF';
  roundLabel: string;
  total: number;
  finished: number;
  isComplete: boolean;
  matches: MatchItem[];
  missingWinners: MatchItem[];
}

export function getRoundCompletionStatus(
  matches: MatchItem[],
  sport: SportType,
  grade: string,
  roundType: 'QF' | 'SF'
): RoundCompletionStatus {
  const roundLabel = roundType === 'QF' ? '8강전' : '4강전';
  const targetMatches = matches.filter((m) => {
    if (m.sport !== sport) return false;
    if (getMatchGrade(m) !== grade) return false;
    const slot = getMatchTournamentSlot(m);
    if (roundType === 'QF') {
      return (
        slot === 'QF1' ||
        slot === 'QF2' ||
        slot === 'QF3' ||
        slot === 'QF4' ||
        ((Boolean(m.round?.includes('8강') || m.title?.includes('8강'))) && !m.round?.includes('4강'))
      );
    } else {
      return (
        slot === 'SF1' ||
        slot === 'SF2' ||
        ((Boolean(m.round?.includes('4강') || m.round?.includes('준결승') || m.title?.includes('4강') || m.title?.includes('준결승'))) &&
          !m.round?.includes('8강') &&
          !m.round?.includes('결승') &&
          !m.title?.includes('결승'))
      );
    }
  });

  const total = targetMatches.length;
  // A match is finished only when status is 'FINISHED' and a winner is decided (including PK winner)
  const finishedMatches = targetMatches.filter(
    (m) => m.status === 'FINISHED' && (
      (Number(m.homeScore) || 0) !== (Number(m.awayScore) || 0) ||
      Boolean(getMatchWinner(m))
    )
  );
  const missingWinners = targetMatches.filter(
    (m) => m.status !== 'FINISHED' || (
      (Number(m.homeScore) || 0) === (Number(m.awayScore) || 0) && !getMatchWinner(m)
    )
  );

  const isComplete = total > 0 && finishedMatches.length === total;

  return {
    sport,
    grade,
    roundType,
    roundLabel,
    total,
    finished: finishedMatches.length,
    isComplete,
    matches: targetMatches,
    missingWinners
  };
}

/**
 * Synchronizes tournament bracket advancement when all matches in a round (n강) are finished.
 * Complies with user mandate: "토너먼트 기준으로 할 때, n강이 다 끝났을 때 자동으로 되게 해줄래? 모든 종목 포함."
 */
export async function syncCompletedTournamentRounds(
  allMatches: MatchItem[]
): Promise<{ updatedCount: number; logs: string[]; pendingInfo: string[] }> {
  if (!allMatches || allMatches.length === 0) {
    return { updatedCount: 0, logs: [], pendingInfo: [] };
  }

  let totalUpdated = 0;
  const allLogs: string[] = [];
  const pendingInfo: string[] = [];

  // Identify all tournament groups by (sport, grade)
  const sportGradePairs = new Set<string>();
  for (const m of allMatches) {
    if (m.matchType === 'tournament' || ['soccer', 'basketball', 'dodgeball', 'tug_of_war'].includes(m.sport)) {
      const grade = getMatchGrade(m);
      sportGradePairs.add(`${m.sport}__${grade}`);
    }
  }

  for (const pair of sportGradePairs) {
    const [sportKey, grade] = pair.split('__') as [SportType, string];
    const sportMetaLabel = getSportNameKorean(sportKey);

    // -------------------------------------------------------------
    // 1. 8강 (Quarterfinals) Check:
    // Only advance when ALL 8강 matches are completely finished!
    // -------------------------------------------------------------
    const qfStatus = getRoundCompletionStatus(allMatches, sportKey, grade, 'QF');
    if (qfStatus.total > 0) {
      if (qfStatus.isComplete) {
        // Find QF1, QF2, QF3, QF4
        const qf1 = qfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'QF1') || qfStatus.matches[0];
        const qf2 = qfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'QF2') || qfStatus.matches[1];
        const qf3 = qfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'QF3') || qfStatus.matches[2];
        const qf4 = qfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'QF4') || qfStatus.matches[3];

        // Targets: SF1 and SF2
        const sf1 = allMatches.find(
          (m) => m.sport === sportKey && getMatchGrade(m) === grade && getMatchTournamentSlot(m) === 'SF1'
        );
        const sf2 = allMatches.find(
          (m) => m.sport === sportKey && getMatchGrade(m) === grade && getMatchTournamentSlot(m) === 'SF2'
        );

        // SF1: QF1 winner (Home) vs QF2 winner (Away)
        if (sf1 && qf1 && qf2) {
          const w1 = getMatchWinner(qf1);
          const w2 = getMatchWinner(qf2);
          if (w1 && (sf1.homeTeam !== w1.name || sf1.homeClass !== w1.classId)) {
            sf1.homeTeam = w1.name;
            sf1.homeClass = w1.classId;
            try {
              await updateMatch(sf1.id, { homeTeam: w1.name, homeClass: w1.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${sf1.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 1경기 승자 ${w1.name} → 4강 1경기(홈) 자동 진출`);
          }
          if (w2 && (sf1.awayTeam !== w2.name || sf1.awayClass !== w2.classId)) {
            sf1.awayTeam = w2.name;
            sf1.awayClass = w2.classId;
            try {
              await updateMatch(sf1.id, { awayTeam: w2.name, awayClass: w2.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${sf1.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 2경기 승자 ${w2.name} → 4강 1경기(원정) 자동 진출`);
          }
        }

        // SF2: QF3 winner (Home) vs QF4 winner (Away)
        if (sf2 && qf3 && qf4) {
          const w3 = getMatchWinner(qf3);
          const w4 = getMatchWinner(qf4);
          if (w3 && (sf2.homeTeam !== w3.name || sf2.homeClass !== w3.classId)) {
            sf2.homeTeam = w3.name;
            sf2.homeClass = w3.classId;
            try {
              await updateMatch(sf2.id, { homeTeam: w3.name, homeClass: w3.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${sf2.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 3경기 승자 ${w3.name} → 4강 2경기(홈) 자동 진출`);
          }
          if (w4 && (sf2.awayTeam !== w4.name || sf2.awayClass !== w4.classId)) {
            sf2.awayTeam = w4.name;
            sf2.awayClass = w4.classId;
            try {
              await updateMatch(sf2.id, { awayTeam: w4.name, awayClass: w4.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${sf2.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 4경기 승자 ${w4.name} → 4강 2경기(원정) 자동 진출`);
          }
        }
      } else {
        pendingInfo.push(
          `[${grade}학년 ${sportMetaLabel}] 8강전 진행중 (${qfStatus.finished}/${qfStatus.total} 완료) - 전 경기 종료 시 4강으로 자동 진출합니다.`
        );
      }
    }

    // -------------------------------------------------------------
    // 2. 4강 (Semifinals) Check:
    // Only advance when ALL 4강 matches are completely finished!
    // -------------------------------------------------------------
    const sfStatus = getRoundCompletionStatus(allMatches, sportKey, grade, 'SF');
    if (sfStatus.total > 0) {
      if (sfStatus.isComplete) {
        const sf1 = sfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'SF1') || sfStatus.matches[0];
        const sf2 = sfStatus.matches.find((m) => getMatchTournamentSlot(m) === 'SF2') || sfStatus.matches[1];

        const finalMatch = allMatches.find(
          (m) => m.sport === sportKey && getMatchGrade(m) === grade && getMatchTournamentSlot(m) === 'FINAL'
        );

        if (sf1 && sf2) {
          const w1 = getMatchWinner(sf1);
          const w2 = getMatchWinner(sf2);

          // Final: SF1 Winner (Home) vs SF2 Winner (Away) - 3·4위전은 미진행 정책
          if (finalMatch && w1 && (finalMatch.homeTeam !== w1.name || finalMatch.homeClass !== w1.classId)) {
            finalMatch.homeTeam = w1.name;
            finalMatch.homeClass = w1.classId;
            try {
              await updateMatch(finalMatch.id, { homeTeam: w1.name, homeClass: w1.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${finalMatch.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 1경기 승자 ${w1.name} → 결승전(홈) 자동 진출`);
          }
          if (finalMatch && w2 && (finalMatch.awayTeam !== w2.name || finalMatch.awayClass !== w2.classId)) {
            finalMatch.awayTeam = w2.name;
            finalMatch.awayClass = w2.classId;
            try {
              await updateMatch(finalMatch.id, { awayTeam: w2.name, awayClass: w2.classId });
            } catch (e) {
              console.warn(`[Tournament Auto-Advance] Local match ${finalMatch.id} updated in memory:`, e);
            }
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 2경기 승자 ${w2.name} → 결승전(원정) 자동 진출`);
          }
        }
      } else {
        pendingInfo.push(
          `[${grade}학년 ${sportMetaLabel}] 4강전 진행중 (${sfStatus.finished}/${sfStatus.total} 완료) - 전 경기 종료 시 결승전으로 자동 진출합니다.`
        );
      }
    }
  }

  return { updatedCount: totalUpdated, logs: allLogs, pendingInfo };
}

/**
 * Legacy/Single-match manual advance helper - retained for backwards compatibility or single match override
 */
export async function advanceTournamentRound(
  completedMatch: MatchItem,
  allMatches: MatchItem[]
): Promise<{ updatedCount: number; messages: string[] }> {
  // Delegate to round-completion sync
  const res = await syncCompletedTournamentRounds(allMatches);
  return { updatedCount: res.updatedCount, messages: res.logs };
}

/**
 * Universal tournament advancement synchronizer for all sports and grades
 */
export async function syncAllTournamentAdvancements(
  allMatches: MatchItem[]
): Promise<{ updatedCount: number; logs: string[]; pendingInfo: string[] }> {
  return await syncCompletedTournamentRounds(allMatches);
}

export async function updateScoreWithAudit(
  match: MatchItem,
  newHomeScore: number,
  newAwayScore: number,
  reason: string,
  operator: { id: string; name: string; role: string },
  newEventDesc?: string
): Promise<void> {
  await ensureFirebaseAuth();
  const oldScoreStr = `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`;
  const newScoreStr = `${newHomeScore} : ${newAwayScore}`;

  const isRollback = newHomeScore < (match.homeScore ?? 0) || newAwayScore < (match.awayScore ?? 0);
  const actionType = isRollback ? 'SCORE_ROLLBACK' : 'SCORE_UPDATE';

  const updatedEvents = [...(match.events || [])];
  if (newEventDesc) {
    const elapsedSec = Number(match.elapsedSeconds) || 0;
    updatedEvents.unshift({
      id: `evt-${Date.now()}`,
      minute: Math.max(1, Math.floor(elapsedSec / 60)),
      type: newHomeScore > (match.homeScore ?? 0) ? 'GOAL' : 'POINT_2',
      team: newHomeScore > (match.homeScore ?? 0) ? 'home' : 'away',
      player: operator.name,
      description: newEventDesc,
      timestamp: new Date().toISOString()
    });
  }

  // 1. Update Match Doc
  await updateMatch(match.id, {
    homeScore: Math.max(0, newHomeScore),
    awayScore: Math.max(0, newAwayScore),
    events: updatedEvents
  });

  // 2. Create Immutable Audit Log in Firestore with SHA-256 chain and client IP
  try {
    await createAndSaveAuditLog(
      db,
      {
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        matchId: match.id,
        matchTitle: match.title,
        action: actionType,
        reason: reason || (isRollback ? '실시간 점수 정정 (-1)' : '실시간 득점 기록 (+1)'),
        oldValue: oldScoreStr,
        newValue: newScoreStr,
        previousScore: oldScoreStr,
        updatedScore: newScoreStr,
        venue: match.court
      },
      sanitizeFirestorePayload
    );
  } catch (err) {
    console.warn('[Firebase Audit] Failed to record audit log:', err);
  }
}

/**
 * Quick score step adjustment (+1, -1, +2, +3) with instant audit log
 */
export async function quickAdjustScore(
  match: MatchItem,
  team: 'home' | 'away',
  delta: number,
  operator: { id: string; name: string; role: string },
  customReason?: string
): Promise<void> {
  const currentHome = match.homeScore ?? 0;
  const currentAway = match.awayScore ?? 0;
  const newHome = team === 'home' ? Math.max(0, currentHome + delta) : currentHome;
  const newAway = team === 'away' ? Math.max(0, currentAway + delta) : currentAway;

  const meta = getSportScoreMeta(match.sport);
  const teamName = team === 'home' ? (match.homeTeam || '홈팀') : (match.awayTeam || '원정팀');
  const deltaStr = delta > 0 ? `+${delta}${meta.scoreUnit}` : `${delta}${meta.scoreUnit}`;
  const defaultReason = delta > 0
    ? `[실시간 ${meta.scoreNoun}] ${teamName} ${deltaStr} 기록`
    : `[점수 정정] ${teamName} ${deltaStr} 차감/정정`;

  await updateScoreWithAudit(
    match,
    newHome,
    newAway,
    customReason?.trim() || defaultReason,
    operator,
    `${teamName} ${deltaStr} (${delta > 0 ? meta.scoreNoun : '정정'})`
  );
}

export async function recordMatchGoalWithScorer(
  match: MatchItem,
  team: 'home' | 'away',
  scorerName: string,
  minute: number,
  scoreType: string = '득점',
  operator: { id: string; name: string; role: string },
  points: number = 1,
  eventType: TimelineEvent['type'] = 'GOAL'
): Promise<void> {
  const meta = getSportScoreMeta(match.sport);
  const currentHome = match.homeScore ?? 0;
  const currentAway = match.awayScore ?? 0;
  const newHome = team === 'home' ? currentHome + points : currentHome;
  const newAway = team === 'away' ? currentAway + points : currentAway;

  const teamName = team === 'home' ? (match.homeTeam || '홈팀') : (match.awayTeam || '원정팀');
  const actionText = formatScoreActionText(match.sport, teamName, scorerName, minute, scoreType, points);

  const newEvent: TimelineEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    minute: minute,
    type: eventType,
    team: team,
    player: scorerName,
    points: points,
    description: `${teamName} ${scorerName} 선수 ${scoreType}`,
    timestamp: new Date().toISOString()
  };

  const updatedEvents = [...(match.events || []), newEvent];

  await updateScoreWithAudit(
    { ...match, events: updatedEvents },
    newHome,
    newAway,
    `[${meta.scoreNoun} 기록] ${actionText}`,
    operator,
    actionText
  );
}

export async function removeMatchEventWithAudit(
  match: MatchItem,
  eventId: string,
  revertScore: boolean,
  operator: { id: string; name: string; role: string }
): Promise<void> {
  const targetEvent = (match.events || []).find((e) => e.id === eventId);
  const updatedEvents = (match.events || []).filter((e) => e.id !== eventId);

  let newHome = match.homeScore ?? 0;
  let newAway = match.awayScore ?? 0;

  let pointsToRevert = 0;
  if (revertScore && targetEvent) {
    if (typeof targetEvent.points === 'number') {
      pointsToRevert = targetEvent.points;
    } else if (targetEvent.type === 'POINT_3') {
      pointsToRevert = 3;
    } else if (targetEvent.type === 'POINT_2') {
      pointsToRevert = 2;
    } else if (targetEvent.type === 'GOAL' || targetEvent.type === 'FREE_THROW' || targetEvent.type === 'OUT') {
      pointsToRevert = 1;
    }

    if (pointsToRevert > 0) {
      if (targetEvent.team === 'home') {
        newHome = Math.max(0, newHome - pointsToRevert);
      } else if (targetEvent.team === 'away') {
        newAway = Math.max(0, newAway - pointsToRevert);
      }
    }
  }

  const meta = getSportScoreMeta(match.sport);
  const desc = targetEvent
    ? `[이벤트 삭제] ${targetEvent.minute}분 ${targetEvent.player || ''} ${targetEvent.description}${revertScore && pointsToRevert > 0 ? ` (스코어 ${pointsToRevert}${meta.scoreUnit} 차감 환원)` : ''}`
    : `[이벤트 삭제] ID ${eventId}`;

  await updateScoreWithAudit(
    { ...match, events: updatedEvents },
    newHome,
    newAway,
    desc,
    operator,
    desc
  );
}

// -------------------------------------------------------------
// Notices Listener & Creator
// -------------------------------------------------------------


export async function setMatchReminder(reminder: MatchReminderItem): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'reminders', `${reminder.studentId}_${reminder.matchId}`);
    await setDoc(docRef, sanitizeFirestorePayload(reminder));
  } catch (e) {
    console.error('[Firebase] setMatchReminder error:', e);
  }
}

export async function removeMatchReminder(studentId: string, matchId: string): Promise<void> {
  try {
    const docRef = doc(db, 'reminders', `${studentId}_${matchId}`);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('[Firebase] removeMatchReminder error:', e);
  }
}

export async function setBulkMatchReminders(studentId: string, matchIds: string[], leadMinutes = 10): Promise<void> {
  const cleanId = (studentId || '').trim();
  if (!cleanId || !matchIds || matchIds.length === 0) return;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    matchIds.forEach((mId) => {
      const docRef = doc(db, 'reminders', `${cleanId}_${mId}`);
      batch.set(docRef, sanitizeFirestorePayload({
        id: `${cleanId}_${mId}`,
        matchId: mId,
        studentId: cleanId,
        leadMinutes
      }));
    });
    await batch.commit();
  } catch (e) {
    console.error('[Firebase] setBulkMatchReminders error:', e);
  }
}

export async function removeBulkMatchReminders(studentId: string, matchIds: string[]): Promise<void> {
  const cleanId = (studentId || '').trim();
  if (!cleanId || !matchIds || matchIds.length === 0) return;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    matchIds.forEach((mId) => {
      const docRef = doc(db, 'reminders', `${cleanId}_${mId}`);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (e) {
    console.error('[Firebase] removeBulkMatchReminders error:', e);
  }
}

export function listenUserReminders(studentId: string, callback: (reminders: MatchReminderItem[]) => void): () => void {
  try {
    const q = query(collection(db, 'reminders'), where('studentId', '==', studentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MatchReminderItem[] = [];
      snapshot.forEach((d) => list.push(d.data() as MatchReminderItem));
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

// -------------------------------------------------------------
// Direct Messages (쪽지 시스템)
// -------------------------------------------------------------


export function listenScoreApprovals(callback: (requests: any[]) => void): () => void {
  try {
    const q = collection(db, 'score_approvals');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ ...data, id: d.id });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function submitScoreApprovalRequest(req: any): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const id = req.id || `req-${Date.now()}`;
    const docRef = doc(db, 'score_approvals', id);
    await setDoc(docRef, sanitizeFirestorePayload({
      ...req,
      id,
      status: req.status || 'PENDING',
      createdAt: req.createdAt || new Date().toISOString()
    }), { merge: true });
  } catch (e) {
    console.error('[Firebase] submitScoreApprovalRequest error:', e);
    throw e;
  }
}

export async function approveScoreRequest(
  requestId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  fallbackData?: any
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    // 1. Mark approval as APPROVED using setDoc with merge: true so it works whether doc exists or not
    const appRef = doc(db, 'score_approvals', requestId);
    const payload: Record<string, any> = {
      id: requestId,
      status: 'APPROVED',
      approvedAt: new Date().toISOString()
    };
    if (fallbackData) {
      Object.assign(payload, sanitizeFirestorePayload(fallbackData));
      payload.id = requestId;
      payload.status = 'APPROVED';
      payload.approvedAt = new Date().toISOString();
    }
    await setDoc(appRef, payload, { merge: true });

    // 2. Update match score and status
    if (matchId) {
      const matchRef = doc(db, 'matches', matchId);
      await setDoc(matchRef, sanitizeFirestorePayload({
        id: matchId,
        homeScore,
        awayScore,
        status: 'FINISHED',
        period: '경기 종료',
        timerRunning: false,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    }
  } catch (e) {
    console.error('[Firebase] approveScoreRequest error:', e);
    throw e;
  }
}

export async function rejectScoreRequest(
  requestId: string,
  reason?: string,
  fallbackData?: any
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const appRef = doc(db, 'score_approvals', requestId);
    const payload: Record<string, any> = {
      id: requestId,
      status: 'REJECTED',
      rejectionReason: reason || '본부 확인 결과 반려',
      rejectedAt: new Date().toISOString()
    };
    if (fallbackData) {
      Object.assign(payload, sanitizeFirestorePayload(fallbackData));
      payload.id = requestId;
      payload.status = 'REJECTED';
      payload.rejectionReason = reason || '본부 확인 결과 반려';
      payload.rejectedAt = new Date().toISOString();
    }
    await setDoc(appRef, payload, { merge: true });
  } catch (e) {
    console.error('[Firebase] rejectScoreRequest error:', e);
    throw e;
  }
}

// -------------------------------------------------------------
// Login Inquiries & Account Problem Reporting (로그인 문제 접수)
// -------------------------------------------------------------


export async function addLiveCommentary(
  matchId: string,
  commentatorName: string,
  text: string,
  isSttGenerated: boolean,
  user: UserProfile
): Promise<string> {
  if (!text || !text.trim()) return '';
  await ensureFirebaseAuth();

  const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const item: LiveCommentaryItem = {
    id,
    matchId,
    authorId: user.studentId || user.uid,
    authorName: user.name,
    authorRole: user.role,
    commentatorName: commentatorName || `${user.name} 해설위원`,
    text: text.trim(),
    isSttGenerated,
    timestamp: timeStr,
    createdAt: now.toISOString()
  };

  const docRef = doc(db, 'live_commentaries', id);
  await setDoc(docRef, sanitizeFirestorePayload(item));
  return id;
}

export function listenLiveCommentaries(
  matchId: string,
  callback: (items: LiveCommentaryItem[]) => void
): () => void {
  try {
    let q;
    if (matchId) {
      q = query(
        collection(db, 'live_commentaries'),
        where('matchId', '==', matchId)
      );
    } else {
      q = collection(db, 'live_commentaries');
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: LiveCommentaryItem[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as LiveCommentaryItem);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        console.warn('[Firebase] listenLiveCommentaries error:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('[Firebase] listenLiveCommentaries init error:', e);
    callback([]);
    return () => {};
  }
}

export async function deleteLiveCommentary(commentaryId: string): Promise<void> {
  if (!commentaryId) return;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'live_commentaries', commentaryId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('[Firebase] deleteLiveCommentary error:', e);
    throw e;
  }
}
