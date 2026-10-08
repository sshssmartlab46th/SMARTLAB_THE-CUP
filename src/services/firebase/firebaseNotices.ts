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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  NoticeItem,
  InjuryEntry,
  SuggestionItem,
  ClassLineup,
  DirectMessage,
  UserProfile,
  MVPVote,
  AppDocument,
  MatchItem
} from '../../types';
import { DEFAULT_APP_DOCUMENTS } from '../../data/defaultDocuments';
import { maskLineupsForUser } from '../../utils/lineupMasking';
import { ensureFirebaseAuth, handleFirestoreError, OperationType, sanitizeFirestorePayload } from './firebaseCore';

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


export function listenLineups(
  callback: (lineups: ClassLineup[]) => void,
  context?: { user?: UserProfile | null; matches?: MatchItem[] }
): () => void {
  try {
    const q = collection(db, 'lineups');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClassLineup[] = [];
      snapshot.forEach((d) => list.push(d.data() as ClassLineup));

      if (context?.user !== undefined || context?.matches !== undefined) {
        const masked = maskLineupsForUser(list, context.matches || [], context.user);
        callback(masked);
      } else {
        callback(list);
      }
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

// -------------------------------------------------------------
// STT Live Commentary Methods (실시간 음성 해설)
// -------------------------------------------------------------
