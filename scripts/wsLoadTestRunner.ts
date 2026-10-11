import { WsLoadTester, calculateLatencyPercentiles } from './wsLoadTester';
import { getLoadTestConfig, LoadTestConfig } from './wsLoadTestConfig';

export function parseCliArgs(args: string[]): Partial<LoadTestConfig> {
  const overrides: Partial<LoadTestConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--connections' || arg === '-c') {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val)) overrides.totalConnections = val;
    } else if (arg === '--duration' || arg === '-d') {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val)) overrides.testDurationMs = val * 1000;
    } else if (arg === '--url' || arg === '-u') {
      if (args[i + 1]) overrides.targetUrl = args[i + 1];
    } else if (arg === '--batch' || arg === '-b') {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val)) overrides.rampUpBatchSize = val;
    }
  }

  return overrides;
}

export async function runLoadTestRunner(cliArgs: string[] = process.argv.slice(2)) {
  const overrides = parseCliArgs(cliArgs);
  const config = getLoadTestConfig(overrides);

  console.log('====================================================');
  console.log(' SANGSAN REALTIME WEBSOCKET 1,000 LOAD TEST SUITE');
  console.log('====================================================');
  console.log(` Target Server URL  : ${config.targetUrl}`);
  console.log(` Target Connections : ${config.totalConnections}`);
  console.log(` Ramp-Up Batch Size : ${config.rampUpBatchSize} connections`);
  console.log(` Ramp-Up Interval   : ${config.rampUpIntervalMs} ms`);
  console.log(` Hold Duration      : ${config.testDurationMs / 1000} seconds`);
  console.log(` Action Frequency   : every ${config.actionIntervalMs} ms / client`);
  console.log('====================================================\n');

  const tester = new WsLoadTester(config);

  // Live Status Monitor Interval
  const statusInterval = setInterval(() => {
    const stats = tester.getStats();
    const elapsedSec = Math.round((Date.now() - stats.startTime) / 1000);
    console.log(
      `[${elapsedSec}s] Active Clients: ${stats.activeClients}/${config.totalConnections} | ` +
      `Msgs Sent: ${stats.totalMessagesSent} | Msgs Recv: ${stats.totalMessagesReceived} | ` +
      `Batch Updates: ${stats.batchUpdateCount} | Avg Latency: ${stats.avgLatencyMs}ms (P95: ${stats.p95LatencyMs}ms) | Errors: ${stats.totalErrors}`
    );
  }, 2000);

  try {
    const finalStats = await tester.run();
    clearInterval(statusInterval);

    console.log('\n====================================================');
    console.log('               LOAD TEST SUMMARY REPORT             ');
    console.log('====================================================');
    console.log(` Target Connections Attempted : ${config.totalConnections}`);
    console.log(` Successful Connections Peak  : ${finalStats.connectedClients}`);
    console.log(` Connection Failures         : ${finalStats.failedConnections}`);
    console.log(` Disconnections              : ${finalStats.disconnectedClients}`);
    console.log(` Total Messages Sent          : ${finalStats.totalMessagesSent}`);
    console.log(` Total Messages Received      : ${finalStats.totalMessagesReceived}`);
    console.log(` Total Batch Updates Handled  : ${finalStats.batchUpdateCount}`);
    console.log(` Heartbeat Pings Sent         : ${finalStats.pingCount}`);
    console.log(` Heartbeat Pongs Received     : ${finalStats.pongCount}`);
    console.log(` Total Errors Logged          : ${finalStats.totalErrors}`);
    console.log('----------------------------------------------------');
    console.log(' Latency Benchmarks (ms):');
    console.log(`   Min Latency : ${finalStats.minLatencyMs} ms`);
    console.log(`   Avg Latency : ${finalStats.avgLatencyMs} ms`);
    console.log(`   P95 Latency : ${finalStats.p95LatencyMs} ms`);
    console.log(`   P99 Latency : ${finalStats.p99LatencyMs} ms`);
    console.log(`   Max Latency : ${finalStats.maxLatencyMs} ms`);
    console.log('====================================================\n');

    const success = finalStats.connectedClients >= config.totalConnections * 0.9;
    if (success) {
      console.log(' SUCCESS: Server sustained target concurrent load test conditions.');
    } else {
      console.warn(' WARNING: Server failed to sustain 90%+ target concurrent connections.');
    }

    return finalStats;
  } catch (err) {
    clearInterval(statusInterval);
    console.error(' [LoadTestRunner] Critical load test failure:', err);
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTestRunner().catch(() => process.exit(1));
}
