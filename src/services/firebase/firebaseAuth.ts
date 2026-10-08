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
import { db } from '../../lib/firebase';
import {
  UserProfile,
  UserRole,
  LoginInquiry
} from '../../types';
import { ensureFirebaseAuth, handleFirestoreError, OperationType, sanitizeFirestorePayload } from './firebaseCore';

// -------------------------------------------------------------
// User Profile Sync & Local Registry Backup
// -------------------------------------------------------------
const LOCAL_USERS_REGISTRY_KEY = 'sangsan_registered_users_registry';

export function getLocalUsersRegistry(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalUserRecord(studentId: string, profile: UserProfile): void {
  try {
    const cleanId = studentId.trim();
    if (!cleanId) return;
    const map = getLocalUsersRegistry();
    map[cleanId] = {
      ...profile,
      studentId: cleanId,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('saveLocalUserRecord error:', e);
  }
}

export function removeLocalUserRecord(studentId: string): void {
  try {
    const cleanId = studentId.trim();
    if (!cleanId) return;
    const map = getLocalUsersRegistry();
    delete map[cleanId];
    localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('removeLocalUserRecord error:', e);
  }
}

export async function syncUserProfile(profile: UserProfile): Promise<void> {
  const studentId = (profile.studentId || '').trim();
  if (studentId) {
    saveLocalUserRecord(studentId, profile);
  }
  try {
    await ensureFirebaseAuth();
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


export async function checkStudentIdExists(studentId: string): Promise<boolean> {
  const cleanId = (studentId || '').trim();
  if (!cleanId) return false;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return true;
    const localMap = getLocalUsersRegistry();
    return Boolean(localMap[cleanId]);
  } catch (e) {
    console.warn('[Firebase] checkStudentIdExists error:', e);
    const localMap = getLocalUsersRegistry();
    return Boolean(localMap[cleanId]);
  }
}

export async function getUserProfile(studentId: string): Promise<UserProfile | null> {
  const cleanId = (studentId || '').trim();
  if (!cleanId) return null;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      saveLocalUserRecord(cleanId, data);
      return data;
    }
    // Check local registry fallback
    const localMap = getLocalUsersRegistry();
    if (localMap[cleanId]) {
      return localMap[cleanId];
    }
    return null;
  } catch (e) {
    console.warn('[Firebase] getUserProfile error:', e);
    const localMap = getLocalUsersRegistry();
    return localMap[cleanId] || null;
  }
}

export async function createAccount(profile: UserProfile): Promise<boolean> {
  const cleanId = (profile.studentId || '').trim();
  if (!cleanId) return false;

  try {
    await ensureFirebaseAuth();
    const exists = await checkStudentIdExists(cleanId);
    if (exists) {
      return false; // Duplicate
    }
    const docRef = doc(db, 'users', cleanId);
    const roles: UserRole[] = profile.isTeacher
      ? ['teacher']
      : (profile.roles && profile.roles.length > 0
          ? Array.from(new Set<UserRole>(['student', ...profile.roles]))
          : [profile.role || 'student']);

    const fullProfile: UserProfile = {
      ...profile,
      studentId: cleanId,
      role: profile.role || (profile.isTeacher ? 'teacher' : 'student'),
      roles,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await setDoc(docRef, sanitizeFirestorePayload(fullProfile));
    saveLocalUserRecord(cleanId, fullProfile);
    return true;
  } catch (e) {
    console.error('[Firebase] createAccount error:', e);
    saveLocalUserRecord(cleanId, profile);
    throw e;
  }
}

export async function deleteUser(studentId: string): Promise<void> {
  const cleanId = (studentId || '').trim();
  removeLocalUserRecord(cleanId);
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', cleanId);
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
  const cleanId = studentId.trim();
  removeLocalUserRecord(cleanId);
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', cleanId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[Firebase] resetStudentAccount error:', e);
  }
}

export async function updateStudentName(studentId: string, newName: string): Promise<void> {
  const cleanId = studentId.trim();
  const cleanName = newName.trim();
  const localMap = getLocalUsersRegistry();
  if (localMap[cleanId]) {
    localMap[cleanId].name = cleanName;
    saveLocalUserRecord(cleanId, localMap[cleanId]);
  }
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'users', cleanId);
    await updateDoc(docRef, {
      name: cleanName,
      lastLogin: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[Firebase] updateStudentName error:', e);
  }
}

// -------------------------------------------------------------
// App Official Documents (규정집, 스마트랩 소개, 개인정보처리방침 등 어드민 관리)
// -------------------------------------------------------------
