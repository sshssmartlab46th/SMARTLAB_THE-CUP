import { createMatch } from './firebaseMatches';
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
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import {
  MatchItem,
  NoticeItem,
  AuditLogEntry,
  FestivalConfig,
} from '../../types';
import { getKSTNowParts, toKSTIsoString } from '../../utils/kstTime';

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
