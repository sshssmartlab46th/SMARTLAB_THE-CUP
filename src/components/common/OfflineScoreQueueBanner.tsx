import React, { useState, useEffect } from 'react';
import { offlineScoreQueue, OfflineQueueState } from '../../services/offlineScoreQueue';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OfflineScoreQueueBannerProps {
  className?: string;
  compact?: boolean;
}

export const OfflineScoreQueueBanner: React.FC<OfflineScoreQueueBannerProps> = ({
  className = '',
  compact = false
}) => {
  const [queueState, setQueueState] = useState<OfflineQueueState>(() => offlineScoreQueue.getState());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineScoreQueue.subscribe((state) => {
      setQueueState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setSyncMessage(null);
    const result = await offlineScoreQueue.flushQueue();
    if (result.processedCount > 0) {
      setSyncMessage(` 성공적으로 ${result.processedCount}건의 오프라인 점수가 서버에 동기화되었습니다!`);
      setTimeout(() => setSyncMessage(null), 4000);
    } else if (result.remainingCount > 0) {
      setSyncMessage('⚠️ 아직 네트워크 연결이 불안정하여 일부 항목 동기화가 대기 중입니다.');
      setTimeout(() => setSyncMessage(null), 4000);
    } else {
      setSyncMessage(' 대기 중인 오프라인 점수가 없습니다.');
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const { isOnline, isFlushing, queue, lastSyncedAt } = queueState;
  const pendingCount = queue.length;

  // Don't render anything if online and queue is empty and no sync toast message
  if (isOnline && pendingCount === 0 && !syncMessage) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toast feedback after manual or auto sync */}
      {syncMessage && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-white/80 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Banner */}
      {(!isOnline || pendingCount > 0) && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-sm ${
            !isOnline
              ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/40 dark:border-amber-800'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  !isOnline
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <RefreshCw className={`w-4 h-4 ${isFlushing ? 'animate-spin' : ''}`} />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {!isOnline ? '🔴 오프라인 신호 대기중 (심판 오프라인 큐 작동)' : '🔵 서버 동기화 준비 완료'}
                  </span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] animate-bounce">
                      {pendingCount}건 대기
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                  {!isOnline
                    ? '네트워크 신호가 끊겨도 입력한 점수가 로컬에 안전하게 보존되며, 신호가 복구되면 서버에 자동 전송됩니다.'
                    : `${pendingCount}건의 점수 입력이 오프라인 상태에서 대기 중입니다. 자동 전송 중...`}
                </p>

                {lastSyncedAt && (
                  <p className="text-[10px] text-slate-400">
                    최근 최종 동기화 시각: {new Date(lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isFlushing || !isOnline}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3 h-3 ${isFlushing ? 'animate-spin' : ''}`} />
                <span>{isFlushing ? '동기화 중...' : '지금 수동 동기화'}</span>
              </button>
            </div>
          </div>

          {/* Queue items list preview in expanded mode */}
          {!compact && pendingCount > 0 && (
            <div className="mt-3 pt-2.5 border-t border-amber-200 dark:border-amber-800/60 space-y-1">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📋 대기 중인 오프라인 작업 목록</span>
                <span className="text-[10px] text-slate-500">순차 자동 처리 (FIFO)</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] flex items-center justify-between font-mono"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                      [{item.type}] {item.payload?.match?.title || item.payload?.req?.title || '경기 점수'}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
