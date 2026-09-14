import React from 'react';
import { ScoreApprovalRequestItem } from '../../../types';
import { Zap, CheckCheck, XCircle, Clock } from 'lucide-react';

export interface AdminScoreApprovalCardProps {
  requests?: ScoreApprovalRequestItem[];
  unconfirmedPointsTotal?: number;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  autoApproveEnabled?: boolean;
  onToggleAutoApprove?: () => void;
}

export const AdminScoreApprovalCard: React.FC<AdminScoreApprovalCardProps> = ({
  requests = [],
  unconfirmedPointsTotal = 0,
  onApprove,
  onReject,
  autoApproveEnabled = false,
  onToggleAutoApprove
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      {/* Top summary badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              실시간 점수 승인 대기
            </div>
            <div className="text-xl font-black font-mono text-red-600 dark:text-red-400">
              {requests.length}건
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold">
            즉시 확인 필요
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              미확정 포인트 누적
            </div>
            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              {unconfirmedPointsTotal.toLocaleString()} pts
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            경기 승인 시 자동반영
          </span>
        </div>
      </div>

      {/* Section title & auto approve button */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          실시간 점수 승인 요청 리스트
        </h3>

        {onToggleAutoApprove && (
          <button
            type="button"
            onClick={onToggleAutoApprove}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
              autoApproveEnabled
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            전체 자동 승인 활성화
          </button>
        )}
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          현재 대기 중인 점수 승인 요청이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div 
              key={req.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {req.title}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {req.homeTeam} [{req.homeScore}] vs [{req.awayScore}] {req.awayTeam}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  보고자: {req.reporterName} ({req.reporterRole})
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onApprove?.(req.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  점수 확정
                </button>
                <button
                  type="button"
                  onClick={() => onReject?.(req.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  재경기/반려
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
