import { describe, it, expect, vi } from 'vitest';
import {
  GENESIS_HASH,
  computeSha256,
  getClientIp,
  buildAuditLogHashInput,
  verifyAuditLogChain,
  createAndSaveAuditLog
} from './auditLogger';
import { AuditLogEntry } from '../types';

describe('AuditLogger - SHA-256 Chain & IP Logging', () => {
  it('computes SHA-256 hash correctly as 64-char hex string', async () => {
    const input = 'test-audit-log-data';
    const hash = await computeSha256(input);

    expect(hash).toBeTypeOf('string');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);

    // Identical input should produce identical hash
    const hash2 = await computeSha256(input);
    expect(hash2).toBe(hash);
  });

  it('provides a fallback IP address when network is offline or fails', async () => {
    const ip = await getClientIp();
    expect(ip).toBeTypeOf('string');
    expect(ip.length).toBeGreaterThan(0);
  });

  it('builds canonical hash input string consistently', () => {
    const inputStr = buildAuditLogHashInput(
      GENESIS_HASH,
      '2026-09-15T09:00:00.000Z',
      '20305',
      '김상산',
      'referee',
      'match-1',
      'SCORE_UPDATE',
      '0 : 0',
      '1 : 0',
      '전반 10분 골',
      '127.0.0.1'
    );

    expect(inputStr).toBe(
      `${GENESIS_HASH}|2026-09-15T09:00:00.000Z|20305|김상산|referee|match-1|SCORE_UPDATE|0 : 0|1 : 0|전반 10분 골|127.0.0.1`
    );
  });

  it('validates chain continuity for consecutive audit log entries', async () => {
    const entry1PrevHash = GENESIS_HASH;
    const entry1Time = '2026-09-15T10:00:00.000Z';
    const entry1Input = buildAuditLogHashInput(
      entry1PrevHash,
      entry1Time,
      '20305',
      '김상산',
      'referee',
      'match-1',
      'SCORE_UPDATE',
      '0 : 0',
      '1 : 0',
      '1점 추가',
      '121.130.1.1'
    );
    const entry1Hash = await computeSha256(entry1Input);

    const log1: AuditLogEntry = {
      id: 'log-1',
      operatorId: '20305',
      operatorName: '김상산',
      operatorRole: 'referee',
      matchId: 'match-1',
      matchTitle: '축구 8강 1경기',
      action: 'SCORE_UPDATE',
      reason: '1점 추가',
      oldValue: '0 : 0',
      newValue: '1 : 0',
      timestamp: entry1Time,
      ipAddress: '121.130.1.1',
      previousHash: entry1PrevHash,
      hash: entry1Hash
    };

    const entry2PrevHash = entry1Hash;
    const entry2Time = '2026-09-15T10:05:00.000Z';
    const entry2Input = buildAuditLogHashInput(
      entry2PrevHash,
      entry2Time,
      '20305',
      '김상산',
      'referee',
      'match-1',
      'SCORE_UPDATE',
      '1 : 0',
      '1 : 1',
      '동점골 기록',
      '121.130.1.1'
    );
    const entry2Hash = await computeSha256(entry2Input);

    const log2: AuditLogEntry = {
      id: 'log-2',
      operatorId: '20305',
      operatorName: '김상산',
      operatorRole: 'referee',
      matchId: 'match-1',
      matchTitle: '축구 8강 1경기',
      action: 'SCORE_UPDATE',
      reason: '동점골 기록',
      oldValue: '1 : 0',
      newValue: '1 : 1',
      timestamp: entry2Time,
      ipAddress: '121.130.1.1',
      previousHash: entry2PrevHash,
      hash: entry2Hash
    };

    const chainResult = await verifyAuditLogChain([log1, log2]);
    expect(chainResult.isValid).toBe(true);
    expect(chainResult.tamperedLogIds).toHaveLength(0);
  });

  it('detects tampered log entries when values or hashes do not match chain', async () => {
    const entry1PrevHash = GENESIS_HASH;
    const entry1Time = '2026-09-15T10:00:00.000Z';
    const entry1Input = buildAuditLogHashInput(
      entry1PrevHash,
      entry1Time,
      '20305',
      '김상산',
      'referee',
      'match-1',
      'SCORE_UPDATE',
      '0 : 0',
      '1 : 0',
      '1점 추가',
      '121.130.1.1'
    );
    const entry1Hash = await computeSha256(entry1Input);

    const log1: AuditLogEntry = {
      id: 'log-1',
      operatorId: '20305',
      operatorName: '김상산',
      operatorRole: 'referee',
      matchId: 'match-1',
      matchTitle: '축구 8강 1경기',
      action: 'SCORE_UPDATE',
      reason: '1점 추가 (수정됨!)', // Tampered reason!
      oldValue: '0 : 0',
      newValue: '1 : 0',
      timestamp: entry1Time,
      ipAddress: '121.130.1.1',
      previousHash: entry1PrevHash,
      hash: entry1Hash // Hash calculated with original reason, so verification will fail!
    };

    const chainResult = await verifyAuditLogChain([log1]);
    expect(chainResult.isValid).toBe(false);
    expect(chainResult.tamperedLogIds).toContain('log-1');
  });

  it('creates and saves audit log with mock DB', async () => {
    const mockDb = {} as any;
    const log = await createAndSaveAuditLog(mockDb, {
      operatorId: 'sshsgym',
      operatorName: '관리자',
      operatorRole: 'admin',
      matchId: 'match-2',
      matchTitle: '농구 결승전',
      action: 'STATUS_CHANGE',
      reason: '경기 재개',
      oldValue: 'PAUSED',
      newValue: 'LIVE'
    });

    expect(log.id).toBeDefined();
    expect(log.operatorId).toBe('sshsgym');
    expect(log.previousHash).toBe(GENESIS_HASH);
    expect(log.hash).toHaveLength(64);
    expect(log.ipAddress).toBeDefined();
  });
});
