import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import firebaseConfig from '../firebase-applet-config.json';
import { createGroqResponse } from './groqHandler';
import { handleAdminLogin } from './adminAuthHandler';
import { handleMvpVote } from './mvpHandler';
import { MatchTimerService } from './timerService';
import { CheerService, CheerState } from './cheerService';
import { ReactionService, LiveReactionType } from './reactionService';

// Firebase client SDK for reliable Firestore connection in any Node environment
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  getDocs, 
  setDoc,
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const PORT = Number(process.env.PORT) || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// API health endpoint for Cloud Run
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// AI groq proxy endpoint
app.post('/api/groq', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : (req.headers['x-session-token'] as string) || req.body?.token || req.body?.sessionToken;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const result = await createGroqResponse(req.body || {}, { token, ip });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Groq] request failed:', error);
    res.status(502).json({ error: 'Groq request failed.' });
  }
});

// Admin authentication endpoint
app.post('/api/admin-login', (req, res) => {
  try {
    const result = handleAdminLogin(req.body || {});
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[AdminLogin] request failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// MVP vote submission endpoint (Server-authoritative student ID and 1-min timer validation)
app.post('/api/mvp-vote', async (req, res) => {
  try {
    const result = await handleMvpVote(req.body || {}, dbInstance, currentMatches);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[MVPVote] request failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Serve Vite build artifacts in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// -------------------------------------------------------------
// In-Memory State & Buffer Management
// -------------------------------------------------------------
const currentMatches = new Map<string, any>();
let currentCheersFeed: any[] = [];

let hasPendingUpdates = false;

// Initialize Server-Authoritative Cheer Service with short 10s debounced flush + 5min metrics
const cheerService = new CheerService();
cheerService.setOnUpdateCallback(() => {
  hasPendingUpdates = true;
});

// Initialize Server-Authoritative Reaction Service with short 10s debounced flush
const reactionService = new ReactionService();
reactionService.setOnUpdateCallback(() => {
  hasPendingUpdates = true;
});

// Initialize Server-Authoritative Timer Service
const timerService = new MatchTimerService(currentMatches);
timerService.setOnUpdateCallback(() => {
  hasPendingUpdates = true;
});

// -------------------------------------------------------------
// Firebase Firestore Subscription
// -------------------------------------------------------------
let dbInstance: any = null;

async function setupFirestore() {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  console.log(`[RealtimeServer] Initializing Firestore (DB: ${databaseId}, Project: ${firebaseConfig.projectId})...`);

  // Try Admin SDK initialization first, and prepare Client SDK fallback
  try {
    if (!getAdminApps().length) {
      initAdminApp({
        projectId: firebaseConfig.projectId
      });
      console.log('[RealtimeServer] Firebase Admin SDK initialized.');
    }
  } catch (adminErr) {
    console.warn('[RealtimeServer] Admin SDK init note (falling back to client SDK):', adminErr);
  }

  // Initialize Firebase Client SDK with Anonymous Auth for reliable Node.js access in any environment
  const clientApp = !getClientApps().length ? initClientApp(firebaseConfig) : getClientApps()[0];
  const auth = getAuth(clientApp);
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log('[RealtimeServer] Firebase Anonymous Auth established.');
    } catch (authErr: any) {
      if (authErr?.code === 'auth/admin-restricted-operation') {
        console.log('[RealtimeServer] Anonymous Auth restricted in Firebase console; proceeding with unauthenticated Firestore access.');
      } else {
        console.warn('[RealtimeServer] Firebase Anonymous Auth note:', authErr?.message || authErr);
      }
    }
  }

  dbInstance = getClientFirestore(clientApp, databaseId);
  timerService.setDbInstance(dbInstance);
  timerService.start();

  cheerService.setDbInstance(dbInstance);
  cheerService.start(10000, 300000); // 10s debounced flush, 5m growth metrics

  reactionService.setDbInstance(dbInstance);
  reactionService.start(10000); // 10s debounced flush

  // 1. Initial restore of cheers from Firestore
  try {
    const cheersSnap = await getDocs(collection(dbInstance, 'cheers'));
    const records: Array<{ id: string; data: CheerState }> = [];
    cheersSnap.forEach((docSnap) => {
      records.push({
        id: docSnap.id,
        data: docSnap.data() as CheerState
      });
    });
    cheerService.restoreInitialState(records);
    console.log(`[RealtimeServer] Restored ${records.length} cheer records into memory.`);
  } catch (err) {
    console.warn('[RealtimeServer] Failed to restore cheers initial snapshot:', err);
  }

  // 1b. Initial restore of live_reactions from Firestore
  try {
    const reactionsSnap = await getDocs(collection(dbInstance, 'live_reactions'));
    const reactionRecords: Array<{ id: string; data: any }> = [];
    reactionsSnap.forEach((docSnap) => {
      reactionRecords.push({
        id: docSnap.id,
        data: docSnap.data()
      });
    });
    reactionService.restoreInitialState(reactionRecords);
    console.log(`[RealtimeServer] Restored ${reactionRecords.length} reaction records into memory.`);
  } catch (err) {
    console.warn('[RealtimeServer] Failed to restore live_reactions initial snapshot:', err);
  }

  // 2. onSnapshot: matches collection
  try {
    onSnapshot(collection(dbInstance, 'matches'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          currentMatches.delete(change.doc.id);
        } else {
          const matchData = {
            ...change.doc.data(),
            id: change.doc.id
          };
          timerService.handleMatchUpdate(matchData);
          currentMatches.set(change.doc.id, matchData);
        }
      });
      hasPendingUpdates = true;
    }, (error) => {
      console.error('[RealtimeServer] matches onSnapshot error:', error);
    });
    console.log('[RealtimeServer] Subscribed to matches collection.');
  } catch (err) {
    console.error('[RealtimeServer] Failed to subscribe to matches:', err);
  }

  // 3. onSnapshot: cheers collection (External updates, if any)
  try {
    onSnapshot(collection(dbInstance, 'cheers'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'removed') {
          cheerService.handleExternalUpdate(change.doc.id, change.doc.data() as CheerState);
        }
      });
    }, (error) => {
      console.error('[RealtimeServer] cheers onSnapshot error:', error);
    });
    console.log('[RealtimeServer] Subscribed to cheers collection.');
  } catch (err) {
    console.error('[RealtimeServer] Failed to subscribe to cheers:', err);
  }

  // 4. onSnapshot: cheer_messages collection (Limit 30)
  try {
    const qFeed = query(collection(dbInstance, 'cheer_messages'), orderBy('createdAt', 'desc'), limit(30));
    onSnapshot(qFeed, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push(d.data()));
      currentCheersFeed = list;
      hasPendingUpdates = true;
    }, (error) => {
      console.error('[RealtimeServer] cheer_messages onSnapshot error:', error);
    });
    console.log('[RealtimeServer] Subscribed to cheer_messages collection.');
  } catch (err) {
    console.error('[RealtimeServer] Failed to subscribe to cheer_messages:', err);
  }

  // 5. onSnapshot: live_reactions collection (External updates, if any)
  try {
    onSnapshot(collection(dbInstance, 'live_reactions'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'removed') {
          reactionService.handleExternalUpdate(change.doc.id, change.doc.data());
        }
      });
    }, (error) => {
      console.error('[RealtimeServer] live_reactions onSnapshot error:', error);
    });
    console.log('[RealtimeServer] Subscribed to live_reactions collection.');
  } catch (err) {
    console.error('[RealtimeServer] Failed to subscribe to live_reactions:', err);
  }
}

// -------------------------------------------------------------
// 3.5s Batch Broadcast Timer
// -------------------------------------------------------------
const BATCH_INTERVAL_MS = 3500; // 3.5 seconds

function broadcastBatch() {
  if (wss.clients.size === 0) {
    return;
  }

  if (!hasPendingUpdates) {
    return;
  }

  const payload = JSON.stringify({
    type: 'BATCH_UPDATE',
    timestamp: Date.now(),
    matches: Array.from(currentMatches.values()),
    cheers: cheerService.getCheersRecord(),
    cheersFeed: currentCheersFeed.slice(0, 30),
    reactions: reactionService.getReactionsRecord()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (e) {
        // ignore individual socket write errors
      }
    }
  });

  hasPendingUpdates = false;
}

setInterval(broadcastBatch, BATCH_INTERVAL_MS);

// -------------------------------------------------------------
// WebSocket Client Handling
// -------------------------------------------------------------
wss.on('connection', (ws) => {
  // 1. Immediately send current full state to newly connected client
  const initialState = JSON.stringify({
    type: 'INITIAL_STATE',
    timestamp: Date.now(),
    matches: Array.from(currentMatches.values()),
    cheers: cheerService.getCheersRecord(),
    cheersFeed: currentCheersFeed.slice(0, 30),
    reactions: reactionService.getReactionsRecord()
  });

  try {
    ws.send(initialState);
  } catch (err) {
    console.warn('[RealtimeServer] Failed to send initial state:', err);
  }

  // 2. Handle incoming client events (cheers, reactions, sync requests)
  ws.on('message', (messageData) => {
    try {
      const data = JSON.parse(messageData.toString());

      if (data.action === 'sync') {
        // Full state re-sync requested after reconnection
        ws.send(JSON.stringify({
          type: 'FULL_SYNC',
          timestamp: Date.now(),
          matches: Array.from(currentMatches.values()),
          cheers: cheerService.getCheersRecord(),
          cheersFeed: currentCheersFeed.slice(0, 30),
          reactions: reactionService.getReactionsRecord()
        }));
        return;
      }

      if (data.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      if (data.action === 'cheer' && data.matchId && data.team) {
        const { matchId, team, emoji } = data;
        cheerService.incrementCheer(matchId, team, emoji);
        hasPendingUpdates = true;
        return;
      }

      if (data.action === 'reaction' && data.reactionType) {
        const matchId = data.matchId || Array.from(currentMatches.keys())[0] || 'global';
        reactionService.incrementReaction(matchId, data.reactionType as LiveReactionType);
        hasPendingUpdates = true;
        return;
      }
    } catch (parseErr) {
      console.warn('[RealtimeServer] Invalid message from client:', parseErr);
    }
  });

  ws.on('error', (err) => {
    console.warn('[RealtimeServer] WebSocket client error:', err);
  });
});

// Fallback all other routes to index.html for SPA client
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Realtime Relay Server is running. Dist assets not found yet.');
  }
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('[RealtimeServer] SIGTERM received. Flushing remaining data...');
  timerService.stop();
  cheerService.stop();
  reactionService.stop();
  await timerService.flushToFirestore();
  await cheerService.flushAllToFirestore();
  await reactionService.flushAllToFirestore();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[RealtimeServer] SIGINT received. Flushing remaining data...');
  timerService.stop();
  cheerService.stop();
  reactionService.stop();
  await timerService.flushToFirestore();
  await cheerService.flushAllToFirestore();
  await reactionService.flushAllToFirestore();
  process.exit(0);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[RealtimeServer] Running on http://0.0.0.0:${PORT} with WebSocket relay enabled.`);
  setupFirestore().catch((err) => {
    console.error('[RealtimeServer] Firestore setup failed:', err);
  });
});
