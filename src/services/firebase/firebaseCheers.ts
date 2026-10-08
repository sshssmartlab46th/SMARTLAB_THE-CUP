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
  increment
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { realtimeWsClient } from '../realtimeWsClient';
import {
  CheerCount,
  CheerMessageItem,
  LiveReactionType
} from '../../types';
import { ensureFirebaseAuth, sanitizeFirestorePayload } from './firebaseCore';
import { formatKSTTime } from '../../utils/kstTime';

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



export async function sendLiveReaction(matchIdOrReactionType: string, reactionType?: LiveReactionType): Promise<void> {
  let matchId: string;
  let type: LiveReactionType;

  if (reactionType) {
    matchId = matchIdOrReactionType;
    type = reactionType;
  } else {
    matchId = 'global';
    type = matchIdOrReactionType as LiveReactionType;
  }

  // 1. Transmit reaction via WebSocket relay
  const sentViaWs = realtimeWsClient.sendReaction(matchId, type);
  if (sentViaWs) {
    return;
  }

  // 2. Direct Firestore fallback if WS inactive or on Vercel
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'live_reactions', matchId);
    await setDoc(docRef, {
      matchId,
      reactions: {
        [type]: increment(1)
      },
      [type]: increment(1)
    }, { merge: true });
  } catch (e) {
    console.warn('[Firebase Reaction] Error:', e);
  }
}

export function listenLiveReactions(matchId: string, callback: (reactions: Record<LiveReactionType, number>) => void): () => void {
  let firestoreUnsub: (() => void) | null = null;
  let hasReceivedData = false;

  const wrappedCallback = (reactions: Record<LiveReactionType, number>) => {
    hasReceivedData = true;
    callback(reactions);
  };

  // 1. Subscribe via WebSocket relay
  const wsUnsub = realtimeWsClient.subscribeReactions(matchId, wrappedCallback);

  // 2. Start direct Firestore fallback if WS inactive
  const startFirestoreFallback = () => {
    if (firestoreUnsub) return;
    try {
      const docRef = doc(db, 'live_reactions', matchId);
      firestoreUnsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const reactions = {
            fire: 0,
            clap: 0,
            heart: 0,
            cheer: 0,
            trophy: 0,
            sparkles: 0,
            star: 0,
            ...(data.reactions || {})
          };
          ['fire', 'clap', 'heart', 'cheer', 'trophy', 'sparkles', 'star'].forEach((k) => {
            if (typeof data[k] === 'number') {
              (reactions as any)[k] = data[k];
            }
          });
          callback(reactions);
        } else {
          callback({
            fire: 0, clap: 0, heart: 0, cheer: 0, trophy: 0, sparkles: 0, star: 0
          });
        }
      }, () => callback({
        fire: 0, clap: 0, heart: 0, cheer: 0, trophy: 0, sparkles: 0, star: 0
      }));
    } catch (e) {
      callback({
        fire: 0, clap: 0, heart: 0, cheer: 0, trophy: 0, sparkles: 0, star: 0
      });
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


// -------------------------------------------------------------
// Injury Encyclopedia
// -------------------------------------------------------------
