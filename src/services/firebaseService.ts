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
  arrayUnion 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { realtimeWsClient } from './realtimeWsClient';
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
  CheerMessageItem,
  LoginInquiry,
  AppDocument,
  SportType
} from '../types';
import { DEFAULT_APP_DOCUMENTS } from '../data/defaultDocuments';

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

/**
 * Recursively strips undefined fields from an object or array so Firestore
 * setDoc/updateDoc never throws "Unsupported field value: undefined".
 */
export function sanitizeFirestorePayload<T>(val: T): T {
  if (val === undefined) {
    return undefined as unknown as T;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }
  if (val instanceof Date) {
    return val;
  }
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(val as Record<string, any>)) {
    if (v !== undefined) {
      const sanitizedChild = sanitizeFirestorePayload(v);
      if (sanitizedChild !== undefined) {
        res[k] = sanitizedChild;
      }
    }
  }
  return res as T;
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
// Seed Initial Data into Firestore if collection is empty
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    const q = collection(db, 'matches');
    const snap = await getDocs(q);
    if (!snap.empty) {
      return false; // already has matches
    }

    const { dateStr } = getKSTNowParts();
    const today = dateStr || '2026-09-15';

    const initialMatches: Partial<MatchItem>[] = [
      // 1. 축구 (남자 8강 토너먼트 - 1학년)
      {
        id: 'seed-soccer-qf1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 8강 1경기',
        round: '8강 1경기',
        tournamentSlot: 'QF1',
        court: '대운동장 A',
        homeTeam: '1-1반',
        awayTeam: '1-2반',
        homeClass: '101',
        awayClass: '102',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '전반전 전',
        startTime: toKSTIsoString(today, '09:00')
      },
      {
        id: 'seed-soccer-qf2',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 8강 2경기',
        round: '8강 2경기',
        tournamentSlot: 'QF2',
        court: '대운동장 A',
        homeTeam: '1-3반',
        awayTeam: '1-4반',
        homeClass: '103',
        awayClass: '104',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '전반전 전',
        startTime: toKSTIsoString(today, '09:50')
      },
      {
        id: 'seed-soccer-qf3',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 8강 3경기',
        round: '8강 3경기',
        tournamentSlot: 'QF3',
        court: '대운동장 A',
        homeTeam: '1-9반',
        awayTeam: '1-10반',
        homeClass: '109',
        awayClass: '110',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '전반전 전',
        startTime: toKSTIsoString(today, '10:40')
      },
      {
        id: 'seed-soccer-qf4',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 8강 4경기',
        round: '8강 4경기',
        tournamentSlot: 'QF4',
        court: '대운동장 A',
        homeTeam: '1-11반',
        awayTeam: '1-12반',
        homeClass: '111',
        awayClass: '112',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '전반전 전',
        startTime: toKSTIsoString(today, '11:30')
      },
      {
        id: 'seed-soccer-sf1',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 4강 1경기',
        round: '4강 1경기',
        tournamentSlot: 'SF1',
        court: '대운동장 A',
        homeTeam: '8강 1G 승자',
        awayTeam: '8강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '13:30')
      },
      {
        id: 'seed-soccer-sf2',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 4강 2경기',
        round: '4강 2경기',
        tournamentSlot: 'SF2',
        court: '대운동장 A',
        homeTeam: '8강 3G 승자',
        awayTeam: '8강 4G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '14:30')
      },
      {
        id: 'seed-soccer-bronze',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 3·4위전',
        round: '3·4위전',
        tournamentSlot: 'BRONZE',
        court: '대운동장 A',
        homeTeam: '4강 1G 패자',
        awayTeam: '4강 2G 패자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '15:30')
      },
      {
        id: 'seed-soccer-final',
        sport: 'soccer',
        matchType: 'tournament',
        title: '1학년 축구 결승전',
        round: '결승전',
        tournamentSlot: 'FINAL',
        court: '대운동장 A',
        homeTeam: '4강 1G 승자',
        awayTeam: '4강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '16:30')
      },

      // 2. 농구 (남자 8강 토너먼트 - 1학년)
      {
        id: 'seed-bb-qf1',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 8강 1경기',
        round: '8강 1경기',
        tournamentSlot: 'QF1',
        court: '체육관 1층',
        homeTeam: '1-2반',
        awayTeam: '1-4반',
        homeClass: '102',
        awayClass: '104',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '1쿼터 전',
        startTime: toKSTIsoString(today, '09:00')
      },
      {
        id: 'seed-bb-qf2',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 8강 2경기',
        round: '8강 2경기',
        tournamentSlot: 'QF2',
        court: '체육관 1층',
        homeTeam: '1-1반',
        awayTeam: '1-3반',
        homeClass: '101',
        awayClass: '103',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '1쿼터 전',
        startTime: toKSTIsoString(today, '09:50')
      },
      {
        id: 'seed-bb-qf3',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 8강 3경기',
        round: '8강 3경기',
        tournamentSlot: 'QF3',
        court: '체육관 1층',
        homeTeam: '1-10반',
        awayTeam: '1-12반',
        homeClass: '110',
        awayClass: '112',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '1쿼터 전',
        startTime: toKSTIsoString(today, '10:40')
      },
      {
        id: 'seed-bb-qf4',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 8강 4경기',
        round: '8강 4경기',
        tournamentSlot: 'QF4',
        court: '체육관 1층',
        homeTeam: '1-9반',
        awayTeam: '1-11반',
        homeClass: '109',
        awayClass: '111',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '1쿼터 전',
        startTime: toKSTIsoString(today, '11:30')
      },
      {
        id: 'seed-bb-sf1',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 4강 1경기',
        round: '4강 1경기',
        tournamentSlot: 'SF1',
        court: '체육관 1층',
        homeTeam: '8강 1G 승자',
        awayTeam: '8강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '13:30')
      },
      {
        id: 'seed-bb-sf2',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 4강 2경기',
        round: '4강 2경기',
        tournamentSlot: 'SF2',
        court: '체육관 1층',
        homeTeam: '8강 3G 승자',
        awayTeam: '8강 4G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '14:30')
      },
      {
        id: 'seed-bb-final',
        sport: 'basketball',
        matchType: 'tournament',
        title: '1학년 농구 결승전',
        round: '결승전',
        tournamentSlot: 'FINAL',
        court: '체육관 1층',
        homeTeam: '4강 1G 승자',
        awayTeam: '4강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '16:00')
      },

      // 3. 피구 (여자 4강 토너먼트 - 5, 6, 7, 8반)
      {
        id: 'seed-dodge-sf1',
        sport: 'dodgeball',
        matchType: 'tournament',
        title: '1학년 피구 4강 1경기',
        round: '4강 1경기',
        tournamentSlot: 'SF1',
        court: '체육관 2층',
        homeTeam: '1-5반',
        awayTeam: '1-6반',
        homeClass: '105',
        awayClass: '106',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '세트전',
        startTime: toKSTIsoString(today, '10:00')
      },
      {
        id: 'seed-dodge-sf2',
        sport: 'dodgeball',
        matchType: 'tournament',
        title: '1학년 피구 4강 2경기',
        round: '4강 2경기',
        tournamentSlot: 'SF2',
        court: '체육관 2층',
        homeTeam: '1-7반',
        awayTeam: '1-8반',
        homeClass: '107',
        awayClass: '108',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '세트전',
        startTime: toKSTIsoString(today, '11:00')
      },
      {
        id: 'seed-dodge-bronze',
        sport: 'dodgeball',
        matchType: 'tournament',
        title: '1학년 피구 3·4위전',
        round: '3·4위전',
        tournamentSlot: 'BRONZE',
        court: '체육관 2층',
        homeTeam: '4강 1G 패자',
        awayTeam: '4강 2G 패자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '13:30')
      },
      {
        id: 'seed-dodge-final',
        sport: 'dodgeball',
        matchType: 'tournament',
        title: '1학년 피구 결승전',
        round: '결승전',
        tournamentSlot: 'FINAL',
        court: '체육관 2층',
        homeTeam: '4강 1G 승자',
        awayTeam: '4강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '14:30')
      },

      // 4. 남자 계주 (1학년 남자 8개 반 릴레이)
      {
        id: 'seed-relay-m-heat1',
        sport: 'relay_male',
        matchType: 'relay_group',
        title: '1학년 남자 계주 예선 1조 (1~4반)',
        round: '예선 1조',
        court: '육상 트랙',
        homeTeam: '1-1반 / 1-2반',
        awayTeam: '1-3반 / 1-4반',
        homeClass: '101',
        awayClass: '103',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '출발전',
        startTime: toKSTIsoString(today, '13:00')
      },
      {
        id: 'seed-relay-m-heat2',
        sport: 'relay_male',
        matchType: 'relay_group',
        title: '1학년 남자 계주 예선 2조 (9~12반)',
        round: '예선 2조',
        court: '육상 트랙',
        homeTeam: '1-9반 / 1-10반',
        awayTeam: '1-11반 / 1-12반',
        homeClass: '109',
        awayClass: '111',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '출발전',
        startTime: toKSTIsoString(today, '13:40')
      },
      {
        id: 'seed-relay-m-final',
        sport: 'relay_male',
        matchType: 'relay_group',
        title: '1학년 남자 계주 결승 레이스',
        round: '결승전',
        court: '육상 트랙',
        homeTeam: '예선 1조 상위 2팀',
        awayTeam: '예선 2조 상위 2팀',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '출발전',
        startTime: toKSTIsoString(today, '15:20')
      },

      // 5. 여자 계주 (1학년 여자 4개 반 릴레이)
      {
        id: 'seed-relay-f-final',
        sport: 'relay_female',
        matchType: 'relay_group',
        title: '1학년 여자 계주 결승 레이스 (5~8반)',
        round: '결승전',
        court: '육상 트랙',
        homeTeam: '1-5반 / 1-6반',
        awayTeam: '1-7반 / 1-8반',
        homeClass: '105',
        awayClass: '107',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '출발전',
        startTime: toKSTIsoString(today, '14:20')
      },

      // 6. 줄다리기
      {
        id: 'seed-tug-sf1',
        sport: 'tug_of_war',
        matchType: 'tournament',
        title: '1학년 줄다리기 4강 1경기',
        round: '4강 1경기',
        court: '대운동장 중앙',
        homeTeam: '1-1/2반 연합',
        awayTeam: '1-3/4반 연합',
        homeClass: '101',
        awayClass: '103',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '11:00')
      },
      {
        id: 'seed-tug-sf2',
        sport: 'tug_of_war',
        matchType: 'tournament',
        title: '1학년 줄다리기 4강 2경기',
        round: '4강 2경기',
        court: '대운동장 중앙',
        homeTeam: '1-9/10반 연합',
        awayTeam: '1-11/12반 연합',
        homeClass: '109',
        awayClass: '111',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '11:40')
      },
      {
        id: 'seed-tug-final',
        sport: 'tug_of_war',
        matchType: 'tournament',
        title: '1학년 줄다리기 결승전',
        round: '결승전',
        court: '대운동장 중앙',
        homeTeam: '4강 1G 승자',
        awayTeam: '4강 2G 승자',
        homeClass: 'TBD',
        awayClass: 'TBD',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: toKSTIsoString(today, '15:00')
      },

      // 7. 단체 줄넘기
      {
        id: 'seed-rope-1',
        sport: 'group_rope',
        matchType: 'relay_group',
        title: '1학년 단체 줄넘기 기록 측정 (전체 반)',
        round: '기록 측정',
        court: '체육관 앞 광장',
        homeTeam: '1학년 1~6반',
        awayTeam: '1학년 7~12반',
        homeClass: '101',
        awayClass: '107',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED',
        period: '측정전',
        startTime: toKSTIsoString(today, '10:00')
      }
    ];

    for (const m of initialMatches) {
      await createMatch(m);
    }
    console.log(`[Firebase] Initial tournament brackets seeded: ${initialMatches.length} matches across all sports.`);
    return true;
  } catch (err) {
    console.error('[Firebase] seedInitialDataIfEmpty error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// User Profile Sync
// -------------------------------------------------------------
export async function syncUserProfile(profile: UserProfile): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const studentId = (profile.studentId || '').trim();
    const docId = studentId || profile.uid || 'unknown';
    const userDocRef = doc(db, 'users', docId);
    const payload = sanitizeFirestorePayload({
      ...profile,
      studentId: docId,
      lastLogin: new Date().toISOString()
    });
    await setDoc(userDocRef, payload, { merge: true });

    // Clean up duplicate legacy doc if profile.uid exists and differs from docId (e.g. 'user_10208')
    if (studentId && profile.uid && profile.uid !== studentId) {
      deleteDoc(doc(db, 'users', profile.uid)).catch(() => {});
    }
  } catch (err) {
    console.warn('[Firebase] syncUserProfile offline save:', err);
  }
}

// -------------------------------------------------------------
// Matches Live Listener & Score Engine
// -------------------------------------------------------------
export function listenMatches(callback: (matches: MatchItem[]) => void): () => void {
  let firestoreUnsub: (() => void) | null = null;
  let hasReceivedData = false;

  const wrappedCallback = (matches: MatchItem[]) => {
    hasReceivedData = true;
    callback(matches);
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
 * Mark a match as finished and automatically synchronize tournament round advancement if an n-gang round completes
 */
export async function finishMatch(matchId: string): Promise<void> {
  if (!matchId) return;
  try {
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
    case 'group_rope': return '단체 줄넘기';
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
  // A match is finished only when status is 'FINISHED' and a winner is decided
  const finishedMatches = targetMatches.filter(
    (m) => m.status === 'FINISHED' && (Number(m.homeScore) || 0) !== (Number(m.awayScore) || 0)
  );
  const missingWinners = targetMatches.filter(
    (m) => m.status !== 'FINISHED' || (Number(m.homeScore) || 0) === (Number(m.awayScore) || 0)
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
            await updateMatch(sf1.id, { homeTeam: w1.name, homeClass: w1.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 1경기 승자 ${w1.name} → 4강 1경기(홈) 자동 진출`);
          }
          if (w2 && (sf1.awayTeam !== w2.name || sf1.awayClass !== w2.classId)) {
            await updateMatch(sf1.id, { awayTeam: w2.name, awayClass: w2.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 2경기 승자 ${w2.name} → 4강 1경기(원정) 자동 진출`);
          }
        }

        // SF2: QF3 winner (Home) vs QF4 winner (Away)
        if (sf2 && qf3 && qf4) {
          const w3 = getMatchWinner(qf3);
          const w4 = getMatchWinner(qf4);
          if (w3 && (sf2.homeTeam !== w3.name || sf2.homeClass !== w3.classId)) {
            await updateMatch(sf2.id, { homeTeam: w3.name, homeClass: w3.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 8강 전 경기 종료] 8강 3경기 승자 ${w3.name} → 4강 2경기(홈) 자동 진출`);
          }
          if (w4 && (sf2.awayTeam !== w4.name || sf2.awayClass !== w4.classId)) {
            await updateMatch(sf2.id, { awayTeam: w4.name, awayClass: w4.classId });
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
        const bronzeMatch = allMatches.find(
          (m) => m.sport === sportKey && getMatchGrade(m) === grade && getMatchTournamentSlot(m) === 'BRONZE'
        );

        if (sf1 && sf2) {
          const w1 = getMatchWinner(sf1);
          const l1 = getMatchLoser(sf1);
          const w2 = getMatchWinner(sf2);
          const l2 = getMatchLoser(sf2);

          // Final: SF1 Winner (Home) vs SF2 Winner (Away)
          if (finalMatch && w1 && (finalMatch.homeTeam !== w1.name || finalMatch.homeClass !== w1.classId)) {
            await updateMatch(finalMatch.id, { homeTeam: w1.name, homeClass: w1.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 1경기 승자 ${w1.name} → 결승전(홈) 자동 진출`);
          }
          if (finalMatch && w2 && (finalMatch.awayTeam !== w2.name || finalMatch.awayClass !== w2.classId)) {
            await updateMatch(finalMatch.id, { awayTeam: w2.name, awayClass: w2.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 2경기 승자 ${w2.name} → 결승전(원정) 자동 진출`);
          }

          // Bronze (3·4위전): SF1 Loser (Home) vs SF2 Loser (Away)
          if (bronzeMatch && l1 && (bronzeMatch.homeTeam !== l1.name || bronzeMatch.homeClass !== l1.classId)) {
            await updateMatch(bronzeMatch.id, { homeTeam: l1.name, homeClass: l1.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 1경기 패자 ${l1.name} → 3·4위전(홈) 자동 배정`);
          }
          if (bronzeMatch && l2 && (bronzeMatch.awayTeam !== l2.name || bronzeMatch.awayClass !== l2.classId)) {
            await updateMatch(bronzeMatch.id, { awayTeam: l2.name, awayClass: l2.classId });
            totalUpdated++;
            allLogs.push(`[${grade}학년 ${sportMetaLabel} 4강 전 경기 종료] 4강 2경기 패자 ${l2.name} → 3·4위전(원정) 자동 배정`);
          }
        }
      } else {
        pendingInfo.push(
          `[${grade}학년 ${sportMetaLabel}] 4강전 진행중 (${sfStatus.finished}/${sfStatus.total} 완료) - 전 경기 종료 시 결승전 및 3·4위전으로 자동 진출합니다.`
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
    await setDoc(doc(auditRef, logItem.id), sanitizeFirestorePayload(logItem));
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

export async function recordMatchGoalWithScorer(
  match: MatchItem,
  team: 'home' | 'away',
  scorerName: string,
  minute: number,
  scoreType: string = '필드골',
  operator: { id: string; name: string; role: string }
): Promise<void> {
  const currentHome = match.homeScore ?? 0;
  const currentAway = match.awayScore ?? 0;
  const newHome = team === 'home' ? currentHome + 1 : currentHome;
  const newAway = team === 'away' ? currentAway + 1 : currentAway;

  const teamName = team === 'home' ? (match.homeTeam || '홈팀') : (match.awayTeam || '원정팀');
  const actionText = `${teamName} ${scorerName} 선수 ${minute}분 골 (${scoreType})`;

  const newEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    minute: minute,
    type: 'GOAL' as const,
    team: team,
    player: scorerName,
    description: `${teamName} ${scorerName} 선수 ${scoreType}`,
    timestamp: new Date().toISOString()
  };

  const updatedEvents = [...(match.events || []), newEvent];

  await updateScoreWithAudit(
    { ...match, events: updatedEvents },
    newHome,
    newAway,
    `[득점 기록] ${actionText}`,
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

  if (revertScore && targetEvent && targetEvent.type === 'GOAL') {
    if (targetEvent.team === 'home') {
      newHome = Math.max(0, newHome - 1);
    } else if (targetEvent.team === 'away') {
      newAway = Math.max(0, newAway - 1);
    }
  }

  const desc = targetEvent 
    ? `[이벤트 삭제] ${targetEvent.minute}분 ${targetEvent.player || ''} ${targetEvent.description}${revertScore ? ' (스코어 1점 차감 환원)' : ''}`
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
  const payload = sanitizeFirestorePayload({
    ...notice,
    id,
    createdAt: new Date().toISOString()
  });
  await setDoc(docRef, payload);
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
  await setDoc(docRef, sanitizeFirestorePayload(lineup), { merge: true });
}

// -------------------------------------------------------------
// Direct Messages (쪽지)
// -------------------------------------------------------------
export function listenMessages(userClass: string, isLeaderOrTeacher: boolean, callback: (msgs: DirectMessage[]) => void): () => void {
  try {
    const q = collection(db, 'direct_messages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DirectMessage[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as DirectMessage;
        // Filter: class-specific or if leader/teacher/council
        if (isLeaderOrTeacher || item.toClass === userClass || item.toClass === 'all') {
          list.push({
            ...item,
            id: d.id || item.id
          });
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
  let firestoreUnsub: (() => void) | null = null;
  let hasReceivedData = false;

  const wrappedCallback = (cheer: CheerCount) => {
    hasReceivedData = true;
    callback(cheer);
  };

  // 1. Subscribe via WebSocket relay
  const wsUnsub = realtimeWsClient.subscribeCheers(matchId, wrappedCallback);

  // 2. Start direct Firestore fallback if WS inactive or on Vercel
  const startFirestoreFallback = () => {
    if (firestoreUnsub) return;
    try {
      const docRef = doc(db, 'cheers', matchId);
      firestoreUnsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as CheerCount);
        } else {
          callback({ matchId, homeCheers: 0, awayCheers: 0 });
        }
      }, () => callback({ matchId, homeCheers: 0, awayCheers: 0 }));
    } catch (e) {
      callback({ matchId, homeCheers: 0, awayCheers: 0 });
    }
  };

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

export async function sendCheer(matchId: string, team: 'home' | 'away', emoji: string): Promise<void> {
  // 1. Send via WebSocket relay if connected (In-memory aggregation + 3.5s batch + 5min Firestore flush)
  const sentViaWs = realtimeWsClient.sendCheer(matchId, team, emoji);
  if (sentViaWs) {
    return;
  }

  // 2. Fallback to direct Firestore write (Vercel deployment or offline WS)
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
  let firestoreUnsub: (() => void) | null = null;
  let hasReceivedData = false;

  const wrappedCallback = (feed: CheerMessageItem[]) => {
    hasReceivedData = true;
    callback(feed);
  };

  // 1. Subscribe via WebSocket relay
  const wsUnsub = realtimeWsClient.subscribeCheersFeed(wrappedCallback);

  // 2. Start direct Firestore fallback if WS inactive or on Vercel
  const startFirestoreFallback = () => {
    if (firestoreUnsub) return;
    try {
      const q = query(collection(db, 'cheer_messages'), orderBy('createdAt', 'desc'), limit(30));
      firestoreUnsub = onSnapshot(q, (snapshot) => {
        const list: CheerMessageItem[] = [];
        snapshot.forEach((d) => list.push(d.data() as CheerMessageItem));
        callback(list);
      }, () => callback([]));
    } catch (e) {
      callback([]);
    }
  };

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
    await setDoc(docRef, sanitizeFirestorePayload(item));
  } catch (e) {
    console.error('[Firebase] sendCheerMessage error:', e);
  }
}

export async function sendLiveReaction(reactionType: 'fire' | 'clap' | 'heart' | 'cheer'): Promise<void> {
  // Transmit reaction directly via WebSocket in-memory relay; eliminates per-click Firestore document creation
  realtimeWsClient.sendReaction(reactionType);
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
  await setDoc(docRef, sanitizeFirestorePayload({
    ...injury,
    createdAt: injury.createdAt || now,
    updatedAt: now
  }), { merge: true });
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
  const payload = sanitizeFirestorePayload({
    ...item,
    id,
    createdAt: new Date().toISOString()
  });
  await setDoc(docRef, payload);
}

export async function answerSuggestion(id: string, answer: string, answeredBy: string): Promise<void> {
  const docRef = doc(db, 'suggestions', id);
  const payload = sanitizeFirestorePayload({
    answer,
    answeredBy,
    answeredAt: new Date().toISOString()
  });
  await updateDoc(docRef, payload);
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
  await setDoc(docRef, sanitizeFirestorePayload({
    ...config,
    updatedAt: new Date().toISOString()
  }), { merge: true });
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
    const roles: UserRole[] = profile.isTeacher
      ? ['teacher']
      : (profile.roles && profile.roles.length > 0
          ? Array.from(new Set<UserRole>(['student', ...profile.roles]))
          : [profile.role || 'student']);

    await setDoc(docRef, sanitizeFirestorePayload({
      ...profile,
      role: profile.role || (profile.isTeacher ? 'teacher' : 'student'),
      roles,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }));
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
      const userMap = new Map<string, UserProfile>();
      snapshot.forEach((d) => {
        const raw = d.data() as UserProfile;
        const studentId = (raw.studentId || d.id).trim();
        if (!studentId) return;

        const profile: UserProfile = {
          ...raw,
          studentId,
          uid: raw.uid || d.id
        };

        const existing = userMap.get(studentId);
        if (!existing) {
          userMap.set(studentId, profile);
        } else {
          // Merge duplicates: prioritize admin/special roles and newer activity
          const existingScore = (existing.role && existing.role !== 'student' ? 100 : 0) + (existing.lastLogin ? new Date(existing.lastLogin).getTime() : 0);
          const newScore = (profile.role && profile.role !== 'student' ? 100 : 0) + (profile.lastLogin ? new Date(profile.lastLogin).getTime() : 0);
          const winner = newScore >= existingScore ? { ...existing, ...profile } : { ...profile, ...existing };
          userMap.set(studentId, winner);

          // If this document ID is a legacy duplicate (not equal to studentId), remove it quietly
          if (d.id !== studentId) {
            deleteDoc(d.ref).catch(() => {});
          }
        }
      });
      const list = Array.from(userMap.values());
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
    // 선생님은 교원 단독, 일반 학생 베이스는 항상 'student' 포함
    const roles: UserRole[] = role === 'teacher' 
      ? ['teacher'] 
      : Array.from(new Set<UserRole>(['student', role]));
    const payload: Partial<UserProfile> = { role, roles };
    if (canAnswerSuggestion !== undefined) {
      payload.canAnswerSuggestion = canAnswerSuggestion;
    }
    await updateDoc(docRef, sanitizeFirestorePayload(payload));
  } catch (e) {
    console.error('[Firebase] updateUserRole error:', e);
    throw e;
  }
}

/**
 * 복수 역할(겸직) 갱신 함수 (베이스는 학생, 단 선생님 제외)
 */
export async function updateUserRoles(
  studentId: string, 
  newRoles: UserRole[], 
  canAnswerSuggestion?: boolean
): Promise<void> {
  try {
    const docRef = doc(db, 'users', studentId);
    
    // 선생님 여부 확인: 만약 'teacher' 역할이 포함되어 있다면 선생님은 학생이 아니며 겸직 불가
    const isTeacher = newRoles.includes('teacher');
    let finalRoles: UserRole[];
    let primaryRole: UserRole;

    if (isTeacher) {
      finalRoles = ['teacher'];
      primaryRole = 'teacher';
    } else {
      // 베이스는 학생: 선생님을 제외한 모든 학생은 'student'가 기본 포함됨
      const set = new Set<UserRole>(['student']);
      newRoles.forEach((r) => {
        if (r !== 'teacher') set.add(r);
      });
      finalRoles = Array.from(set);

      // 대표 역할 결정 (우선순위: admin > student_council > class_president > referee > health_officer > student)
      const priorityOrder: UserRole[] = ['admin', 'student_council', 'class_president', 'referee', 'health_officer', 'student'];
      primaryRole = priorityOrder.find((p) => finalRoles.includes(p)) || 'student';
    }

    const payload: Partial<UserProfile> = {
      role: primaryRole,
      roles: finalRoles,
      isTeacher
    };

    if (canAnswerSuggestion !== undefined) {
      payload.canAnswerSuggestion = canAnswerSuggestion;
    }

    await updateDoc(docRef, sanitizeFirestorePayload(payload));
  } catch (e) {
    console.error('[Firebase] updateUserRoles error:', e);
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
    await setDoc(voteDocRef, sanitizeFirestorePayload({
      ...vote,
      createdAt: new Date().toISOString()
    }));
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
    await setDoc(docRef, sanitizeFirestorePayload(fullMsg));
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
      snapshot.forEach((d) => {
        const raw = d.data() as DirectMessage;
        list.push({
          ...raw,
          id: d.id || raw.id
        });
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

export async function deleteDirectMessage(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    console.warn('[Firebase] deleteDirectMessage received empty or invalid id:', id);
    return;
  }
  try {
    await ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'direct_messages', id);
    await deleteDoc(docRef);
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (_) {}
  } catch (e) {
    console.error('[Firebase] deleteDirectMessage error:', e);
    throw e;
  }
}

export async function hideDirectMessageForUser(id: string, userIdentifier: string): Promise<void> {
  if (!id || !userIdentifier) return;
  try {
    await ensureFirebaseAuth().catch(() => {});
    const docRef = doc(db, 'direct_messages', id);
    await updateDoc(docRef, {
      deletedFor: arrayUnion(userIdentifier)
    });
  } catch (e) {
    console.warn('[Firebase] hideDirectMessageForUser error:', e);
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

// -------------------------------------------------------------
// Login Inquiries & Account Problem Reporting (로그인 문제 접수)
// -------------------------------------------------------------
export async function submitLoginInquiry(inquiry: {
  studentId: string;
  claimedName: string;
  registeredName?: string | null;
  message: string;
}): Promise<string> {
  await ensureFirebaseAuth();
  const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(db, 'login_inquiries', id);
  const data: LoginInquiry = {
    id,
    studentId: inquiry.studentId.trim(),
    claimedName: inquiry.claimedName.trim(),
    registeredName: inquiry.registeredName?.trim() || null,
    message: inquiry.message.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  await setDoc(docRef, sanitizeFirestorePayload(data));
  return id;
}

export function listenLoginInquiries(callback: (inquiries: LoginInquiry[]) => void): () => void {
  try {
    const q = collection(db, 'login_inquiries');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LoginInquiry[] = [];
      snapshot.forEach((d) => list.push(d.data() as LoginInquiry));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, (err) => {
      console.warn('[Firebase] listenLoginInquiries error:', err);
      callback([]);
    });
    return unsubscribe;
  } catch (e) {
    callback([]);
    return () => {};
  }
}

export async function resolveLoginInquiry(inquiryId: string, resolvedBy: string = '총괄 관리자'): Promise<void> {
  await ensureFirebaseAuth();
  const docRef = doc(db, 'login_inquiries', inquiryId);
  await updateDoc(docRef, {
    status: 'RESOLVED',
    resolvedAt: new Date().toISOString(),
    resolvedBy
  });
}

export async function resetStudentAccount(studentId: string): Promise<void> {
  await ensureFirebaseAuth();
  const docRef = doc(db, 'users', studentId.trim());
  await deleteDoc(docRef);
}

export async function updateStudentName(studentId: string, newName: string): Promise<void> {
  await ensureFirebaseAuth();
  const docRef = doc(db, 'users', studentId.trim());
  await updateDoc(docRef, {
    name: newName.trim(),
    lastLogin: new Date().toISOString()
  });
}

// -------------------------------------------------------------
// App Official Documents (규정집, 스마트랩 소개, 개인정보처리방침 등 어드민 관리)
// -------------------------------------------------------------

export function listenAppDocument(
  docId: string, 
  callback: (doc: AppDocument) => void
): () => void {
  const fallback = DEFAULT_APP_DOCUMENTS[docId] || {
    id: docId,
    title: docId,
    subtitle: '',
    content: '',
    updatedAt: new Date().toISOString(),
    updatedBy: '시스템'
  };

  try {
    ensureFirebaseAuth().catch(console.error);
    const docRef = doc(db, 'app_documents', docId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppDocument;
        callback({
          ...fallback,
          ...data,
          id: docId
        });
      } else {
        callback(fallback);
      }
    }, (error) => {
      console.warn(`[Firebase] listenAppDocument(${docId}) error:`, error);
      callback(fallback);
    });
    return unsubscribe;
  } catch (e) {
    console.warn(`[Firebase] listenAppDocument init error:`, e);
    callback(fallback);
    return () => {};
  }
}

export function listenAllAppDocuments(
  callback: (docs: Record<string, AppDocument>) => void
): () => void {
  const initialMap: Record<string, AppDocument> = { ...DEFAULT_APP_DOCUMENTS };

  try {
    ensureFirebaseAuth().catch(console.error);
    const colRef = collection(db, 'app_documents');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const merged: Record<string, AppDocument> = { ...DEFAULT_APP_DOCUMENTS };
      snapshot.forEach((d) => {
        const data = d.data() as AppDocument;
        merged[d.id] = {
          ...(merged[d.id] || {}),
          ...data,
          id: d.id
        };
      });
      callback(merged);
    }, (error) => {
      console.warn('[Firebase] listenAllAppDocuments error:', error);
      callback(initialMap);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('[Firebase] listenAllAppDocuments init error:', e);
    callback(initialMap);
    return () => {};
  }
}

export async function saveAppDocument(docData: Partial<AppDocument> & { id: string }): Promise<void> {
  await ensureFirebaseAuth();
  const docRef = doc(db, 'app_documents', docData.id);
  const now = new Date().toISOString();
  
  const payload: Partial<AppDocument> = sanitizeFirestorePayload({
    ...docData,
    updatedAt: now,
    updatedBy: docData.updatedBy || '총괄 관리자'
  });

  await setDoc(docRef, payload, { merge: true });
}

export async function resetAppDocument(docId: string, operatorName: string = '총괄 관리자'): Promise<AppDocument> {
  await ensureFirebaseAuth();
  const defaultDoc = DEFAULT_APP_DOCUMENTS[docId];
  if (!defaultDoc) {
    throw new Error(`기본 문서 데이터가 존재하지 않습니다: ${docId}`);
  }

  const restoredDoc: AppDocument = {
    ...defaultDoc,
    updatedAt: new Date().toISOString(),
    updatedBy: `${operatorName} (기본값 초기화)`
  };

  const docRef = doc(db, 'app_documents', docId);
  await setDoc(docRef, sanitizeFirestorePayload(restoredDoc));
  return restoredDoc;
}




