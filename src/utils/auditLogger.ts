import { collection, doc, getDocs, query, orderBy, limit, setDoc, Firestore } from 'firebase/firestore';
import { AuditLogEntry } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

let cachedIp: string | null = null;

/**
 * Retrieves the client's public IP address with caching and fallback.
 */
export async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ip === 'string') {
        cachedIp = data.ip;
        return cachedIp;
      }
    }
  } catch (_err) {
    // Fallback if network is unavailable or times out
  }

  // Fallback IP
  cachedIp = '127.0.0.1';
  return cachedIp;
}

function rightRotate(v: number, n: number): number {
  return (v >>> n) | (v << (32 - n));
}

/**
 * Pure JavaScript SHA-256 Uint8Array implementation supporting UTF-8 bytes
 */
function sha256Bytes(bytes: Uint8Array): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const l = bytes.length;
  const bitLen = l * 8;

  // Pad message
  const paddedLen = ((l + 9 + 63) & ~63);
  const msg = new Uint8Array(paddedLen);
  msg.set(bytes);
  msg[l] = 0x80;

  // Append 64-bit big-endian length at the end
  const view = new DataView(msg.buffer);
  view.setUint32(paddedLen - 4, bitLen & 0xffffffff, false);
  const highLen = Math.floor(bitLen / 0x100000000);
  view.setUint32(paddedLen - 8, highLen, false);

  const W = new Int32Array(64);

  for (let i = 0; i < paddedLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      W[j] = view.getInt32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = (rightRotate(W[j - 15], 7) ^ rightRotate(W[j - 15], 18) ^ (W[j - 15] >>> 3));
      const s1 = (rightRotate(W[j - 2], 17) ^ rightRotate(W[j - 2], 19) ^ (W[j - 2] >>> 10));
      W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

    for (let j = 0; j < 64; j++) {
      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[j] + W[j]) | 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Computes SHA-256 hash string for given text input using Web Crypto API or JS fallback.
 */
export async function computeSha256(data: string): Promise<string> {
  const cryptoObj = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : null);
  if (cryptoObj && cryptoObj.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await cryptoObj.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (_e) {
      // Fallback
    }
  }

  const utf8Bytes = new TextEncoder().encode(data);
  return sha256Bytes(utf8Bytes);
}

/**
 * Constructs the canonical string representation for hashing an audit log entry.
 */
export function buildAuditLogHashInput(
  previousHash: string,
  timestamp: string,
  operatorId: string,
  operatorName: string,
  operatorRole: string,
  matchId: string,
  action: string,
  oldValue: string,
  newValue: string,
  reason: string,
  ipAddress: string
): string {
  return `${previousHash}|${timestamp}|${operatorId}|${operatorName}|${operatorRole}|${matchId}|${action}|${oldValue}|${newValue}|${reason}|${ipAddress}`;
}

/**
 * Fetches the most recent audit log hash from Firestore to maintain the hash chain.
 */
export async function getLatestAuditLogHash(db: Firestore): Promise<string> {
  if (!db || typeof db !== 'object') {
    return GENESIS_HASH;
  }
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data() as AuditLogEntry;
      if (lastDoc.hash && typeof lastDoc.hash === 'string' && lastDoc.hash.length === 64) {
        return lastDoc.hash;
      }
    }
  } catch (err) {
    // Fallback if DB query fails
  }
  return GENESIS_HASH;
}

export interface CreateAuditLogParams {
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  matchId: string;
  matchTitle: string;
  action: 'SCORE_UPDATE' | 'SCORE_ROLLBACK' | 'STATUS_CHANGE' | 'TIMER_RESET';
  reason: string;
  oldValue: string;
  newValue: string;
  venue?: string;
  previousScore?: string;
  updatedScore?: string;
  modifiedByName?: string;
  modifiedBy?: string;
  customId?: string;
  customTimestamp?: string;
}

/**
 * Creates, hashes, and records a new immutable AuditLogEntry with SHA-256 chain and client IP.
 */
export async function createAndSaveAuditLog(
  db: Firestore,
  params: CreateAuditLogParams,
  sanitizePayloadFn?: <T>(val: T) => T
): Promise<AuditLogEntry> {
  const timestamp = params.customTimestamp || new Date().toISOString();
  const id = params.customId || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const ipAddress = await getClientIp();

  const previousHash = await getLatestAuditLogHash(db);
  const hashInput = buildAuditLogHashInput(
    previousHash,
    timestamp,
    params.operatorId,
    params.operatorName,
    params.operatorRole,
    params.matchId,
    params.action,
    params.oldValue,
    params.newValue,
    params.reason,
    ipAddress
  );

  const hash = await computeSha256(hashInput);

  const logItem: AuditLogEntry = {
    id,
    operatorId: params.operatorId,
    operatorName: params.operatorName,
    operatorRole: params.operatorRole,
    matchId: params.matchId,
    matchTitle: params.matchTitle,
    action: params.action,
    reason: params.reason,
    oldValue: params.oldValue,
    newValue: params.newValue,
    timestamp,
    venue: params.venue,
    previousScore: params.previousScore,
    updatedScore: params.updatedScore,
    modifiedByName: params.modifiedByName || params.operatorName,
    modifiedBy: params.modifiedBy || params.operatorId,
    ipAddress,
    previousHash,
    hash
  };

  if (db && typeof db === 'object') {
    try {
      const auditRef = collection(db, 'audit_logs');
      const docRef = doc(auditRef, logItem.id);
      const payload = sanitizePayloadFn ? sanitizePayloadFn(logItem) : logItem;
      await setDoc(docRef, payload);
    } catch (err) {
      // Quiet fallback for testing / offline
    }
  }

  return logItem;
}

/**
 * Verifies the integrity of a SHA-256 hash chain for a given sequence of audit logs (sorted by timestamp asc).
 */
export async function verifyAuditLogChain(logs: AuditLogEntry[]): Promise<{
  isValid: boolean;
  tamperedLogIds: string[];
}> {
  const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const tamperedLogIds: string[] = [];

  let currentExpectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];

    if (log.previousHash && log.previousHash !== currentExpectedPrevHash) {
      tamperedLogIds.push(log.id);
    }

    if (log.hash && log.previousHash) {
      const hashInput = buildAuditLogHashInput(
        log.previousHash,
        log.timestamp,
        log.operatorId,
        log.operatorName,
        log.operatorRole,
        log.matchId,
        log.action,
        log.oldValue,
        log.newValue,
        log.reason,
        log.ipAddress || '127.0.0.1'
      );

      const expectedHash = await computeSha256(hashInput);
      if (log.hash !== expectedHash) {
        if (!tamperedLogIds.includes(log.id)) {
          tamperedLogIds.push(log.id);
        }
      }

      currentExpectedPrevHash = log.hash;
    }
  }

  return {
    isValid: tamperedLogIds.length === 0,
    tamperedLogIds
  };
}
