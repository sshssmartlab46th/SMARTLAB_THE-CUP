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
  increment 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { 
  MatchItem, 
  NoticeItem, 
  InjuryEntry, 
  SuggestionItem, 
  AuditLogEntry, 
  ClassLineup, 
  DirectMessage, 
  CheerCount, 
  UserProfile,
  FestivalConfig,
  MVPVote,
  MatchReminderItem,
  UserRole,
  CheerMessageItem
} from '../types';

// Ensure Firebase Anonymous Auth for Firestore security rules
let currentUser: User | null = null;
let authReadyPromise: Promise<User | null> | null = null;

export function ensureFirebaseAuth(): Promise<User | null> {
  if (currentUser) return Promise.resolve(currentUser);
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          resolve(cred.user);
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign-in fallback:', err);
          resolve(null);
        }
      }
    });
  });

  return authReadyPromise;
}

// Test Connection to Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Successfully connected to Firestore server.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
  }
}
testFirestoreConnection();

// -------------------------------------------------------------
// Seed Initial Data into Firestore if collection is empty (No-op)
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty() {
  // Cleared - waiting for explicit instruction
}

// -------------------------------------------------------------
// User Profile Sync
// -------------------------------------------------------------
export async function syncUserProfile(profile: UserProfile): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const userDocRef = doc(db, 'users', profile.uid || profile.studentId);
    await setDoc(userDocRef, {
      ...profile,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] syncUserProfile offline save:', err);
  }
}

// -------------------------------------------------------------
// Matches Live Listener & Score Engine
// -------------------------------------------------------------
export function listenMatches(callback: (matches: MatchItem[]) => void): () => void {
  ensureFirebaseAuth().catch(console.error);

  try {
    const q = collection(db, 'matches');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: MatchItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            ...data,
            id: docSnap.id
          } as MatchItem);
        });
        callback(list);
      } else {
        callback([]);
      }
    }, (error) => {
      console.warn('[Firebase] listenMatches error:', error);
      callback([]);
    });
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
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
  await setDoc(docRef, fullMatch);
  return id;
}

export async function updateMatch(matchId: string, partial: Partial<MatchItem>): Promise<void> {
  if (!matchId) return;
  try {
    ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'matches', matchId);
    // Sanitize partial payload to avoid Firestore undefined errors
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        sanitized[k] = v;
      }
    }
    await updateDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] updateMatch error:', e);
    throw e;
  }
}

import {
  KST_TIMEZONE,
  parseMatchStartTimeKST,
  formatKSTTime,
  formatKSTDate,
  formatKSTDateTime,
  toKSTIsoString,
  parseKSTDateAndTime,
  getKSTNowParts
} from '../utils/kstTime';

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
 * Mark a match as finished
 */
export async function finishMatch(matchId: string): Promise<void> {
  if (!matchId) return;
  await updateMatch(matchId, {
    status: 'FINISHED',
    period: '경기 종료',
    timerRunning: false
  });
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
  if (str.includes('8강 1') || str.includes('준준결승 1') || str.includes('QF1')) return 'QF1';
  if (str.includes('8강 2') || str.includes('준준결승 2') || str.includes('QF2')) return 'QF2';
  if (str.includes('8강 3') || str.includes('준준결승 3') || str.includes('QF3')) return 'QF3';
  if (str.includes('8강 4') || str.includes('준준결승 4') || str.includes('QF4')) return 'QF4';
  if ((str.includes('4강 1') || str.includes('준결승 1') || str.includes('SF1')) && !str.includes('결승전')) return 'SF1';
  if ((str.includes('4강 2') || str.includes('준결승 2') || str.includes('SF2')) && !str.includes('결승전')) return 'SF2';
  if (str.includes('3·4위') || str.includes('3위') || str.includes('BRONZE')) return 'BRONZE';
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

export async function advanceTournamentRound(
  completedMatch: MatchItem,
  allMatches: MatchItem[]
): Promise<{ updatedCount: number; messages: string[] }> {
  const slot = getMatchTournamentSlot(completedMatch);
  if (!slot || slot === 'FINAL' || slot === 'BRONZE') {
    return { updatedCount: 0, messages: [] };
  }

  let winner: { name: string; classId: string } | null = null;
  let loser: { name: string; classId: string } | null = null;

  if (completedMatch.homeScore > completedMatch.awayScore) {
    winner = { name: completedMatch.homeTeam, classId: completedMatch.homeClass };
    loser = { name: completedMatch.awayTeam, classId: completedMatch.awayClass };
  } else if (completedMatch.awayScore > completedMatch.homeScore) {
    winner = { name: completedMatch.awayTeam, classId: completedMatch.awayClass };
    loser = { name: completedMatch.homeTeam, classId: completedMatch.homeClass };
  } else {
    return { updatedCount: 0, messages: [] };
  }

  const matchGrade = getMatchGrade(completedMatch);
  const sameContextMatches = allMatches.filter(
    (m) => m.id !== completedMatch.id && m.sport === completedMatch.sport && getMatchGrade(m) === matchGrade
  );

  let updatedCount = 0;
  const messages: string[] = [];

  if (slot === 'QF1') {
    const target = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'SF1');
    if (target && (target.homeTeam !== winner.name || target.homeClass !== winner.classId)) {
      await updateMatch(target.id, { homeTeam: winner.name, homeClass: winner.classId });
      updatedCount++;
      messages.push(`[8강 1경기 승자 ${winner.name}] → 4강 1경기(홈) 자동 진출`);
    }
  } else if (slot === 'QF2') {
    const target = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'SF1');
    if (target && (target.awayTeam !== winner.name || target.awayClass !== winner.classId)) {
      await updateMatch(target.id, { awayTeam: winner.name, awayClass: winner.classId });
      updatedCount++;
      messages.push(`[8강 2경기 승자 ${winner.name}] → 4강 1경기(원정) 자동 진출`);
    }
  } else if (slot === 'QF3') {
    const target = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'SF2');
    if (target && (target.homeTeam !== winner.name || target.homeClass !== winner.classId)) {
      await updateMatch(target.id, { homeTeam: winner.name, homeClass: winner.classId });
      updatedCount++;
      messages.push(`[8강 3경기 승자 ${winner.name}] → 4강 2경기(홈) 자동 진출`);
    }
  } else if (slot === 'QF4') {
    const target = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'SF2');
    if (target && (target.awayTeam !== winner.name || target.awayClass !== winner.classId)) {
      await updateMatch(target.id, { awayTeam: winner.name, awayClass: winner.classId });
      updatedCount++;
      messages.push(`[8강 4경기 승자 ${winner.name}] → 4강 2경기(원정) 자동 진출`);
    }
  } else if (slot === 'SF1') {
    const finalTarget = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'FINAL');
    if (finalTarget && (finalTarget.homeTeam !== winner.name || finalTarget.homeClass !== winner.classId)) {
      await updateMatch(finalTarget.id, { homeTeam: winner.name, homeClass: winner.classId });
      updatedCount++;
      messages.push(`[4강 1경기 승자 ${winner.name}] → 결승전(홈) 자동 진출`);
    }
    const bronzeTarget = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'BRONZE');
    if (bronzeTarget && loser && (bronzeTarget.homeTeam !== loser.name || bronzeTarget.homeClass !== loser.classId)) {
      await updateMatch(bronzeTarget.id, { homeTeam: loser.name, homeClass: loser.classId });
      updatedCount++;
      messages.push(`[4강 1경기 패자 ${loser.name}] → 3·4위전(홈) 자동 배정`);
    }
  } else if (slot === 'SF2') {
    const finalTarget = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'FINAL');
    if (finalTarget && (finalTarget.awayTeam !== winner.name || finalTarget.awayClass !== winner.classId)) {
      await updateMatch(finalTarget.id, { awayTeam: winner.name, awayClass: winner.classId });
      updatedCount++;
      messages.push(`[4강 2경기 승자 ${winner.name}] → 결승전(원정) 자동 진출`);
    }
    const bronzeTarget = sameContextMatches.find((m) => getMatchTournamentSlot(m) === 'BRONZE');
    if (bronzeTarget && loser && (bronzeTarget.awayTeam !== loser.name || bronzeTarget.awayClass !== loser.classId)) {
      await updateMatch(bronzeTarget.id, { awayTeam: loser.name, awayClass: loser.classId });
      updatedCount++;
      messages.push(`[4강 2경기 패자 ${loser.name}] → 3·4위전(원정) 자동 배정`);
    }
  }

  return { updatedCount, messages };
}

export async function syncAllTournamentAdvancements(allMatches: MatchItem[]): Promise<{ updatedCount: number; logs: string[] }> {
  let totalUpdated = 0;
  const allLogs: string[] = [];

  const eligible = allMatches.filter(
    (m) => (m.status === 'FINISHED' || m.status === 'LIVE') && m.homeScore !== m.awayScore
  );

  for (const match of eligible) {
    const res = await advanceTournamentRound(match, allMatches);
    totalUpdated += res.updatedCount;
    allLogs.push(...res.messages);
  }

  return { updatedCount: totalUpdated, logs: allLogs };
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

  // 2. Create Immutable Audit Log in Firestore
  try {
    const auditRef = collection(db, 'audit_logs');
    const logItem: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      matchId: match.id,
      matchTitle: match.title,
      action: actionType,
      reason: reason || (isRollback ? '실시간 점수 정정 (-1)' : '실시간 득점 기록 (+1)'),
      oldValue: oldScoreStr,
      newValue: newScoreStr,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(auditRef, logItem.id), logItem);
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

  const teamName = team === 'home' ? (match.homeTeam || '홈팀') : (match.awayTeam || '원정팀');
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
  const defaultReason = delta > 0 
    ? `[실시간 득점] ${teamName} ${deltaStr}점 기록` 
    : `[점수 정정] ${teamName} ${deltaStr}점 차감/정정`;

  await updateScoreWithAudit(
    match,
    newHome,
    newAway,
    customReason?.trim() || defaultReason,
    operator,
    `${teamName} ${deltaStr}점 (${delta > 0 ? '득점' : '정정'})`
  );
}

// -------------------------------------------------------------
// Notices Listener & Creator
// -------------------------------------------------------------
export function listenNotices(callback: (notices: NoticeItem[]) => void): () => void {
  try {
    const q = collection(db, 'notices');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: NoticeItem[] = [];
        snapshot.forEach((d) => list.push(d.data() as NoticeItem));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      } else {
        callback([]);
      }
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function createNotice(notice: Omit<NoticeItem, 'id' | 'createdAt'>): Promise<void> {
  const id = `notice-${Date.now()}`;
  const docRef = doc(db, 'notices', id);
  await setDoc(docRef, {
    ...notice,
    id,
    createdAt: new Date().toISOString()
  });
}

export const sendNotice = createNotice;

export async function deleteNotice(noticeId: string): Promise<void> {
  if (!noticeId) return;
  try {
    ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'notices', noticeId);
    await deleteDoc(docRef);
    console.log('[Firebase] Successfully deleted notice document:', noticeId);
  } catch (e) {
    console.error('[Firebase] deleteNotice error:', e);
    throw e;
  }
}

// -------------------------------------------------------------
// Lineups
// -------------------------------------------------------------
export function listenLineups(callback: (lineups: ClassLineup[]) => void): () => void {
  try {
    const q = collection(db, 'lineups');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClassLineup[] = [];
      snapshot.forEach((d) => list.push(d.data() as ClassLineup));
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function saveLineup(lineup: ClassLineup): Promise<void> {
  const docRef = doc(db, 'lineups', lineup.id);
  await setDoc(docRef, lineup, { merge: true });
}

// -------------------------------------------------------------
// Direct Messages (쪽지)
// -------------------------------------------------------------
export function listenMessages(userClass: string, isLeaderOrTeacher: boolean, callback: (msgs: DirectMessage[]) => void): () => void {
  try {
    const q = collection(db, 'messages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DirectMessage[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as DirectMessage;
        // Filter: class-specific or if leader/teacher/council
        if (isLeaderOrTeacher || item.toClass === userClass || item.toClass === 'all') {
          list.push(item);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

// -------------------------------------------------------------
// Realtime Cheers
// -------------------------------------------------------------
export function listenCheers(matchId: string, callback: (cheer: CheerCount) => void): () => void {
  try {
    const docRef = doc(db, 'cheers', matchId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as CheerCount);
      } else {
        callback({ matchId, homeCheers: 0, awayCheers: 0 });
      }
    }, () => callback({ matchId, homeCheers: 0, awayCheers: 0 }));
    return unsubscribe;
  } catch (e) {
    callback({ matchId, homeCheers: 0, awayCheers: 0 });
    return () => {};
  }
}

export async function sendCheer(matchId: string, team: 'home' | 'away', emoji: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'cheers', matchId);
    await setDoc(docRef, {
      matchId,
      [team === 'home' ? 'homeCheers' : 'awayCheers']: increment(1),
      lastEmoji: emoji
    }, { merge: true });
  } catch (e) {
    console.warn('[Firebase Cheer] Error:', e);
  }
}

export function listenCheersFeed(callback: (cheers: CheerMessageItem[]) => void): () => void {
  try {
    const q = query(collection(db, 'cheer_messages'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CheerMessageItem[] = [];
      snapshot.forEach((d) => list.push(d.data() as CheerMessageItem));
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function sendCheerMessage(
  studentId: string,
  authorMasked: string,
  classLabel: string,
  message: string
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(collection(db, 'cheer_messages'));
    const item: CheerMessageItem = {
      id: docRef.id,
      authorMasked,
      classLabel,
      message,
      createdAt: formatKSTTime(new Date())
    };
    await setDoc(docRef, item);
  } catch (e) {
    console.error('[Firebase] sendCheerMessage error:', e);
  }
}

export async function sendLiveReaction(reactionType: 'fire' | 'clap' | 'heart' | 'cheer'): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(collection(db, 'live_reactions'));
    await setDoc(docRef, {
      reactionType,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[Firebase] sendLiveReaction error:', e);
  }
}


// -------------------------------------------------------------
// Injury Encyclopedia
// -------------------------------------------------------------
export function listenInjuries(callback: (injuries: InjuryEntry[]) => void): () => void {
  try {
    const q = collection(db, 'injuries');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: InjuryEntry[] = [];
        snapshot.forEach((d) => list.push(d.data() as InjuryEntry));
        callback(list);
      } else {
        callback([]);
      }
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function saveInjuryEntry(injury: InjuryEntry): Promise<void> {
  const docRef = doc(db, 'injuries', injury.id);
  const now = new Date().toISOString();
  await setDoc(docRef, {
    ...injury,
    createdAt: injury.createdAt || now,
    updatedAt: now
  }, { merge: true });
}

export async function deleteInjuryEntry(injuryId: string): Promise<void> {
  if (!injuryId) return;
  await deleteDoc(doc(db, 'injuries', injuryId));
}

// -------------------------------------------------------------
// Suggestions & Audit Logs
// -------------------------------------------------------------
export function listenSuggestions(callback: (items: SuggestionItem[]) => void): () => void {
  try {
    const q = collection(db, 'suggestions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: SuggestionItem[] = [];
        snapshot.forEach((d) => list.push(d.data() as SuggestionItem));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      } else {
        callback([]);
      }
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function submitSuggestion(item: Omit<SuggestionItem, 'id' | 'createdAt'>): Promise<void> {
  const id = `sug-${Date.now()}`;
  const docRef = doc(db, 'suggestions', id);
  await setDoc(docRef, {
    ...item,
    id,
    createdAt: new Date().toISOString()
  });
}

export async function answerSuggestion(id: string, answer: string, answeredBy: string): Promise<void> {
  const docRef = doc(db, 'suggestions', id);
  await updateDoc(docRef, {
    answer,
    answeredBy,
    answeredAt: new Date().toISOString()
  });
}

export function listenAuditLogs(callback: (logs: AuditLogEntry[]) => void): () => void {
  try {
    const q = collection(db, 'audit_logs');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: AuditLogEntry[] = [];
        snapshot.forEach((d) => list.push(d.data() as AuditLogEntry));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      } else {
        callback([]);
      }
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

// -------------------------------------------------------------
// Festival Config (대회 탭 개폐 및 행사 설정)
// -------------------------------------------------------------
export function listenFestivalConfig(callback: (config: FestivalConfig | null) => void): () => void {
  try {
    const docRef = doc(db, 'system', 'festival');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as FestivalConfig);
      } else {
        // Default opened state
        callback({
          isOpen: true,
          name: '2026 상산고등학교 체육대회',
          description: '상산고등학교 체육대회 및 축제 실시간 플랫폼'
        });
      }
    }, () => {
      callback({
        isOpen: true,
        name: '2026 상산고등학교 체육대회',
        description: '상산고등학교 체육대회 및 축제 실시간 플랫폼'
      });
    });
    return unsubscribe;
  } catch (e) {
    callback({
      isOpen: true,
      name: '2026 상산고등학교 체육대회',
      description: '상산고등학교 체육대회 및 축제 실시간 플랫폼'
    });
    return () => {};
  }
}

export async function updateFestivalConfig(config: Partial<FestivalConfig>): Promise<void> {
  const docRef = doc(db, 'system', 'festival');
  await setDoc(docRef, {
    ...config,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

// -------------------------------------------------------------
// User Management & Duplicate Student ID Check
// -------------------------------------------------------------
export async function checkStudentIdExists(studentId: string): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', studentId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (e) {
    console.warn('[Firebase] checkStudentIdExists error:', e);
    return false;
  }
}

export async function getUserProfile(studentId: string): Promise<UserProfile | null> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (e) {
    console.warn('[Firebase] getUserProfile error:', e);
    return null;
  }
}

export async function createAccount(profile: UserProfile): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    const exists = await checkStudentIdExists(profile.studentId);
    if (exists) {
      return false; // Duplicate
    }
    const docRef = doc(db, 'users', profile.studentId);
    await setDoc(docRef, {
      ...profile,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('[Firebase] createAccount error:', e);
    throw e;
  }
}

export async function deleteUser(studentId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', studentId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('[Firebase] deleteUser error:', e);
    throw e;
  }
}

export function listenAllUsers(callback: (users: UserProfile[]) => void): () => void {
  try {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => list.push(d.data() as UserProfile));
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function updateUserRole(studentId: string, role: UserRole, canAnswerSuggestion?: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'users', studentId);
    const payload: Partial<UserProfile> = { role };
    if (canAnswerSuggestion !== undefined) {
      payload.canAnswerSuggestion = canAnswerSuggestion;
    }
    await updateDoc(docRef, payload);
  } catch (e) {
    console.error('[Firebase] updateUserRole error:', e);
    throw e;
  }
}

// -------------------------------------------------------------
// MVP Voting System (1분간 투표)
// -------------------------------------------------------------
export async function submitMVPVote(vote: MVPVote): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const voteDocRef = doc(db, 'mvp_votes', `${vote.matchId}_${vote.voterStudentId}`);
    await setDoc(voteDocRef, {
      ...vote,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] submitMVPVote error:', e);
    throw e;
  }
}

export function listenMVPVotes(matchId: string, callback: (votes: MVPVote[]) => void): () => void {
  try {
    const q = query(collection(db, 'mvp_votes'), where('matchId', '==', matchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MVPVote[] = [];
      snapshot.forEach((d) => list.push(d.data() as MVPVote));
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

// -------------------------------------------------------------
// Match Reminders
// -------------------------------------------------------------
export async function setMatchReminder(reminder: MatchReminderItem): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'reminders', `${reminder.studentId}_${reminder.matchId}`);
    await setDoc(docRef, reminder);
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
export async function sendDirectMessage(msg: Omit<DirectMessage, 'id' | 'createdAt'>): Promise<string> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(collection(db, 'direct_messages'));
    const fullMsg: DirectMessage = {
      id: docRef.id,
      ...msg,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, fullMsg);
    return docRef.id;
  } catch (e) {
    console.error('[Firebase] sendDirectMessage error:', e);
    throw e;
  }
}

export function listenAllDirectMessages(callback: (messages: DirectMessage[]) => void): () => void {
  try {
    const q = collection(db, 'direct_messages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DirectMessage[] = [];
      snapshot.forEach((d) => list.push(d.data() as DirectMessage));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, () => callback([]));
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function deleteDirectMessage(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'direct_messages', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('[Firebase] deleteDirectMessage error:', e);
    throw e;
  }
}

// -------------------------------------------------------------
// Points Config (종목별 배점 설정 클라우드 동기화)
// -------------------------------------------------------------
export function listenPointsConfig(callback: (configs: any[] | null) => void): () => void {
  try {
    const docRef = doc(db, 'system', 'points_config');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data()?.configs) {
        callback(snapshot.data().configs);
      } else {
        callback(null);
      }
    }, () => callback(null));
    return unsubscribe;
  } catch (e) {
    callback(null);
    return () => {};
  }
}

export async function savePointsConfig(configs: any[]): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'system', 'points_config');
    await setDoc(docRef, {
      configs,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('[Firebase] savePointsConfig error:', e);
    throw e;
  }
}

// -------------------------------------------------------------
// Score Approval Requests (심판 점수 승인 파이프라인)
// -------------------------------------------------------------
export function listenScoreApprovals(callback: (requests: any[]) => void): () => void {
  try {
    const q = collection(db, 'score_approvals');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push(d.data()));
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
    await setDoc(docRef, {
      ...req,
      id,
      status: req.status || 'PENDING',
      createdAt: req.createdAt || new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] submitScoreApprovalRequest error:', e);
    throw e;
  }
}

export async function approveScoreRequest(
  requestId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    // 1. Mark approval as APPROVED
    const appRef = doc(db, 'score_approvals', requestId);
    await updateDoc(appRef, {
      status: 'APPROVED',
      approvedAt: new Date().toISOString()
    });

    // 2. Update match score and status
    if (matchId) {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        homeScore,
        awayScore,
        status: 'FINISHED',
        period: '경기 종료',
        timerRunning: false,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('[Firebase] approveScoreRequest error:', e);
    throw e;
  }
}

export async function rejectScoreRequest(requestId: string, reason?: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const appRef = doc(db, 'score_approvals', requestId);
    await updateDoc(appRef, {
      status: 'REJECTED',
      rejectionReason: reason || '본부 확인 결과 반려',
      rejectedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] rejectScoreRequest error:', e);
    throw e;
  }
}



