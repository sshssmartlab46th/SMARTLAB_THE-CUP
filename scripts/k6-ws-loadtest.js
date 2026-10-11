import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom K6 Metrics
const wsConnectionErrors = new Counter('ws_connection_errors');
const wsMessagesReceived = new Counter('ws_messages_received');
const wsBatchUpdates = new Counter('ws_batch_updates_received');
const wsLatency = new Trend('ws_ping_pong_latency_ms');

export const options = {
  stages: [
    { duration: '15s', target: 200 },  // Ramp up to 200 connections
    { duration: '30s', target: 1000 }, // Ramp up to 1,000 concurrent VUs
    { duration: '1m', target: 1000 },  // Maintain 1,000 VUs load for 1 minute
    { duration: '15s', target: 0 },    // Ramp down connections
  ],
  thresholds: {
    'ws_connection_errors': ['count<50'],
    'ws_ping_pong_latency_ms': ['p(95)<500'],
  },
};

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:3000';
  const params = { tags: { my_tag: 'sangsan-ws-loadtest' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', function () {
      // Send initial sync action
      socket.send(JSON.stringify({ action: 'sync', clientId: __VU }));

      // Send heartbeat ping every 10 seconds
      socket.setInterval(function () {
        socket.send(JSON.stringify({ action: 'ping', timestamp: Date.now(), clientId: __VU }));
      }, 10000);

      // Send cheer action every 5 seconds
      socket.setInterval(function () {
        socket.send(JSON.stringify({
          action: 'cheer',
          matchId: 'match-demo-1',
          team: __VU % 2 === 0 ? 'home' : 'away',
          emoji: '🔥',
          clientId: __VU
        }));
      }, 5000);
    });

    socket.on('message', function (data) {
      wsMessagesReceived.add(1);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'pong' && parsed.timestamp) {
          const rtt = Date.now() - parsed.timestamp;
          wsLatency.add(rtt);
        } else if (parsed.type === 'BATCH_UPDATE') {
          wsBatchUpdates.add(1);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    socket.on('error', function (e) {
      wsConnectionErrors.add(1);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 60000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
  sleep(1);
}
