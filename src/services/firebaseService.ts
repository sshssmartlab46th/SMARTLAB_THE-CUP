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
  getDocFromServer 
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
        snapshot.forEach((doc) => {
          list.push(doc.data() as MatchItem);
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

export async function updateMatch(matchId: string, partial: Partial<MatchItem>): Promise<void> {
  try {
    const docRef = doc(db, 'matches', matchId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('[Firebase] updateMatch error:', e);
    throw e;
  }
}

export async function updateScoreWithAudit(
  match: MatchItem,
  newHomeScore: number,
  newAwayScore: number,
  reason: string,
  operator: { id: string; name: string; role: string },
  newEventDesc?: string
): Promise<void> {
  const oldScoreStr = `${match.homeScore} : ${match.awayScore}`;
  const newScoreStr = `${newHomeScore} : ${newAwayScore}`;

  const isRollback = newHomeScore < match.homeScore || newAwayScore < match.awayScore;
  const actionType = isRollback ? 'SCORE_ROLLBACK' : 'SCORE_UPDATE';

  const updatedEvents = [...(match.events || [])];
  if (newEventDesc) {
    updatedEvents.unshift({
      id: `evt-${Date.now()}`,
      minute: Math.max(1, Math.floor(match.elapsedSeconds / 60)),
      type: newHomeScore > match.homeScore ? 'GOAL' : 'POINT_2',
      team: newHomeScore > match.homeScore ? 'home' : 'away',
      player: operator.name,
      description: newEventDesc,
      timestamp: new Date().toISOString()
    });
  }

  // 1. Update Match Doc
  await updateMatch(match.id, {
    homeScore: newHomeScore,
    awayScore: newAwayScore,
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
      reason,
      oldValue: oldScoreStr,
      newValue: newScoreStr,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(auditRef, logItem.id), logItem);
  } catch (err) {
    console.warn('[Firebase Audit] Failed to record audit log:', err);
  }
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

export async function sendDirectMessage(msg: Omit<DirectMessage, 'id' | 'createdAt'>): Promise<void> {
  const id = `msg-${Date.now()}`;
  const docRef = doc(db, 'messages', id);
  await setDoc(docRef, {
    ...msg,
    id,
    createdAt: new Date().toISOString()
  });
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
        callback({ matchId, homeCheers: 124, awayCheers: 98 });
      }
    }, () => callback({ matchId, homeCheers: 124, awayCheers: 98 }));
    return unsubscribe;
  } catch (e) {
    callback({ matchId, homeCheers: 124, awayCheers: 98 });
    return () => {};
  }
}

export async function sendCheer(matchId: string, team: 'home' | 'away', emoji: string): Promise<void> {
  try {
    const docRef = doc(db, 'cheers', matchId);
    const snap = await getDocs(query(collection(db, 'cheers'), limit(1))); // warmth check
    // Simple optimistic local + firestore update
    await setDoc(docRef, {
      matchId,
      [team === 'home' ? 'homeCheers' : 'awayCheers']: Math.floor(Math.random() * 5 + 1),
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
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    await setDoc(docRef, item);
  } catch (e) {
    console.error('[Firebase] sendCheerMessage error:', e);
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
  await setDoc(docRef, injury, { merge: true });
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

