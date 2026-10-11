export interface LoadTestConfig {
  targetUrl: string;
  totalConnections: number;
  rampUpBatchSize: number;
  rampUpIntervalMs: number;
  testDurationMs: number;
  pingIntervalMs: number;
  actionIntervalMs: number;
  matchIds: string[];
  enableActions: boolean;
}

export function getLoadTestConfig(overrides: Partial<LoadTestConfig> = {}): LoadTestConfig {
  const envUrl = process.env.VITE_WS_URL || process.env.WS_URL || 'ws://localhost:3000';

  return {
    targetUrl: overrides.targetUrl || envUrl,
    totalConnections: overrides.totalConnections ?? 1000,
    rampUpBatchSize: overrides.rampUpBatchSize ?? 50,
    rampUpIntervalMs: overrides.rampUpIntervalMs ?? 100,
    testDurationMs: overrides.testDurationMs ?? 30000,
    pingIntervalMs: overrides.pingIntervalMs ?? 10000,
    actionIntervalMs: overrides.actionIntervalMs ?? 5000,
    matchIds: overrides.matchIds || ['match-demo-1', 'match-demo-2', 'match-demo-3'],
    enableActions: overrides.enableActions ?? true
  };
}

export function generateClientActionPayload(
  clientId: number,
  matchIds: string[],
  actionType?: 'ping' | 'sync' | 'cheer' | 'reaction'
): Record<string, any> {
  const selectedType =
    actionType ||
    ['ping', 'cheer', 'reaction', 'sync'][Math.floor(Math.random() * 4)];

  const selectedMatchId = matchIds[clientId % matchIds.length] || 'match-demo-1';
  const teams = ['home', 'away'];
  const emojis = ['🔥', '👏', '⚽', '🏀', '🎉'];
  const reactions = ['GOAL', 'DEFENSE', 'CLAP', 'FIRE', 'SHOCK'];

  switch (selectedType) {
    case 'ping':
      return { action: 'ping', timestamp: Date.now(), clientId };

    case 'sync':
      return { action: 'sync', clientId };

    case 'cheer':
      return {
        action: 'cheer',
        matchId: selectedMatchId,
        team: teams[Math.floor(Math.random() * teams.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        clientId
      };

    case 'reaction':
      return {
        action: 'reaction',
        matchId: selectedMatchId,
        reactionType: reactions[Math.floor(Math.random() * reactions.length)],
        clientId
      };

    default:
      return { action: 'ping', timestamp: Date.now(), clientId };
  }
}
