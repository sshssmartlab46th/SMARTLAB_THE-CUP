import React from 'react';
import { Settings, Users, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

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
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-slate-500" />
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
          시스템 연동 현황
        </h3>
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
        {totalMembersCount != null && (
          <div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> 총 등록 회원 (학생/교사)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {(totalMembersCount ?? 0).toLocaleString()}명
              </span>
              {unregisteredMembersCount != null && (
                <span className="text-xs text-slate-400">
                  미등록 {unregisteredMembersCount}명
                </span>
              )}
            </div>
          </div>
        )}

        {totalMatchesCount != null && (
          <div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> 오늘 예약된 총 경기
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {totalMatchesCount}개
              </span>
              <span className="text-xs text-slate-400">
                완료 {completedMatchesCount || 0} · 대기 {pendingMatchesCount || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
