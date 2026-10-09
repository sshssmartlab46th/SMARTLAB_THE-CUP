import React, { useState, useEffect } from 'react';
import { Settings, Users, Activity, Wifi, RefreshCw } from 'lucide-react';
import { fetchServerHealth, ServerHealthInfo } from '../../../services/serverHealthService';

export interface SystemServiceStatus {
  name: string;
  statusText: string;
  isOk: boolean;
}

export interface AdminSystemStatusCardProps {
  services?: SystemServiceStatus[];
  totalMembersCount?: number;
  unregisteredMembersCount?: number;
  totalMatchesCount?: number;
  completedMatchesCount?: number;
  pendingMatchesCount?: number;
  userCount?: number;
  matchCount?: number;
  inquiryCount?: number;
}

export const AdminSystemStatusCard: React.FC<AdminSystemStatusCardProps> = ({
  services = [],
  totalMembersCount,
  unregisteredMembersCount,
  totalMatchesCount,
  completedMatchesCount,
  pendingMatchesCount,
  userCount,
  matchCount,
  inquiryCount
}) => {
  const displayMembers = totalMembersCount ?? userCount ?? 0;
  const displayMatches = totalMatchesCount ?? matchCount ?? 0;

  const [healthInfo, setHealthInfo] = useState<ServerHealthInfo | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(false);

  const loadHealthStatus = async () => {
    setIsLoadingHealth(true);
    const info = await fetchServerHealth();
    setHealthInfo(info);
    setIsLoadingHealth(false);
  };

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 10000); // Poll health every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            시스템 연동 현황
          </h3>
        </div>
        <button
          type="button"
          onClick={loadHealthStatus}
          disabled={isLoadingHealth}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          title="서버 상태 새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Real-time Server & Active WS Connections Monitoring Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Wifi className="w-3.5 h-3.5 text-blue-500" />
            <span>실시간 서버 접속자 모니터링</span>
          </div>
          {healthInfo ? (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              healthInfo.isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
            }`}>
              {healthInfo.isOnline ? '서버 정상' : '서버 오프라인'}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">조회 중...</span>
          )}
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            현재 동시 접속자 (WebSocket):
          </span>
          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {healthInfo ? `${healthInfo.connections.toLocaleString()}명` : '-'}
          </span>
        </div>

        {healthInfo?.timestamp && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
            마지막 확인: {new Date(healthInfo.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="py-2 text-slate-400 text-xs text-center">
          실시간 연동 서비스 항목을 조회 중입니다.
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {services.map((srv, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-slate-400">{srv.name}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                srv.isOk 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' 
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
              }`}>
                {srv.statusText}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
        <div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 총 등록 회원 (학생/교사)
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {displayMembers.toLocaleString()}명
            </span>
            {unregisteredMembersCount != null && (
              <span className="text-xs text-slate-400">
                미등록 {unregisteredMembersCount}명
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> 오늘 예약된 총 경기
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {displayMatches}개
            </span>
            <span className="text-xs text-slate-400">
              완료 {completedMatchesCount || 0} · 대기 {pendingMatchesCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
