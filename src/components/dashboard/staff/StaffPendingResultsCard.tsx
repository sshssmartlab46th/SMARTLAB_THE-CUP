import React from 'react';
import { ScoreApprovalRequestItem } from '../../../types';
import { ShieldAlert, Clock, CheckCircle } from 'lucide-react';

export interface StaffPendingResultsCardProps {
  pendingRequests?: ScoreApprovalRequestItem[];
  staffCount?: number;
  standbyCount?: number;
  zonesCount?: number;
}

export const StaffPendingResultsCard: React.FC<StaffPendingResultsCardProps> = ({
  pendingRequests = [],
  staffCount,
  standbyCount,
  zonesCount
}) => {
  return (
    <div className="space-y-4">
      {/* Role rule notice */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>점수 확정 권한 수칙</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          학생회/체육부는 경기 운영 및 점수 보고를 담당하지만, 최종 득점 확정과 포인트 반영은 총괄 관리자(어드민) 승인을 거쳐 처리됩니다.
        </p>
        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 pt-0.5">
          현재 전송된 대기 요청: {pendingRequests.length}건
        </div>
      </div>

      {/* Stats summary */}
      {(staffCount !== undefined || zonesCount !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 shadow-xs">
            <div className="text-[11px] text-slate-500">운영 스태프 및 자원봉사자</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {staffCount || 0}명
              </span>
              {standbyCount !== undefined && (
                <span className="text-[11px] text-slate-400">본부 대기 {standbyCount}명</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 shadow-xs">
            <div className="text-[11px] text-slate-500">실시간 경기장 배정</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {zonesCount !== undefined ? `${zonesCount}개 구역` : '전 구역 운영 중'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pending matches awaiting admin approval */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            본부 승인 대기 득점 및 매치 결과
          </h3>
          <span className="text-[11px] text-slate-400">최종 승인은 어드민 담당</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            현재 대기 중인 승인 요청이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingRequests.map((req) => (
              <div 
                key={req.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{req.reqCode}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{req.title}</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {req.homeTeam} [{req.homeScore}] vs [{req.awayScore}] {req.awayTeam}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {req.notes || '경기 종료 보고됨'}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                  어드민 승인대기
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
