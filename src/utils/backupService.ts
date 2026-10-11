import { getFirestore, collection, getDocs, doc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export interface ExportedBackupData {
  exportedAt: string;
  version: string;
  collections: {
    matches: any[];
    users: any[];
    notices: any[];
    cheers: any[];
    festival_config: any[];
    documents: any[];
    audit_logs: any[];
    suggestions: any[];
    login_inquiries: any[];
  };
}

/**
 * Fetches all primary Firestore collections and exports them into a JSON snapshot.
 */
export async function exportFirestoreDataJSON(): Promise<ExportedBackupData> {
  const collectionNames = [
    'matches',
    'users',
    'notices',
    'cheers',
    'festival_config',
    'documents',
    'audit_logs',
    'suggestions',
    'login_inquiries'
  ] as const;

  const resultCollections: Record<string, any[]> = {
    matches: [],
    users: [],
    notices: [],
    cheers: [],
    festival_config: [],
    documents: [],
    audit_logs: [],
    suggestions: [],
    login_inquiries: []
  };

  for (const cName of collectionNames) {
    try {
      const snap = await getDocs(collection(db, cName));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      resultCollections[cName] = docs;
    } catch (error) {
      console.warn(`[BackupService] Failed to export collection ${cName}:`, error);
      resultCollections[cName] = [];
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    collections: resultCollections as ExportedBackupData['collections']
  };
}

/**
 * Triggers a browser download of the exported JSON backup data.
 */
export function downloadBackupJSON(data: ExportedBackupData, filename?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const nowStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', filename || `the_sangsan_backup_${nowStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Scrubs student personal identifiable information (학번, 이름) from Firestore user accounts after tournament end.
 * Retains admin account ('sshsgym') and system configuration.
 */
export async function scrubPersonalData(): Promise<{ scrubbedCount: number }> {
  const snap = await getDocs(collection(db, 'users'));

  const batch = writeBatch(db);
  let scrubbedCount = 0;

  for (const d of snap.docs) {
    const userData = d.data() as UserProfile;
    // Skip system admin account 'sshsgym'
    if (userData.studentId === 'sshsgym' || userData.role === 'admin') {
      continue;
    }

    const userRef = doc(db, 'users', d.id);
    batch.update(userRef, {
      name: '익명학생',
      studentId: `ANON_${d.id.slice(0, 6)}`,
      lastLogin: new Date().toISOString(),
      studentNum: '00'
    });
    scrubbedCount++;
  }

  if (scrubbedCount > 0) {
    await batch.commit();
  }

  return { scrubbedCount };
}
