import React from 'react';
import { ScoreApprovalRequestItem } from '../../../types';
import { Send, AlertTriangle, CheckCircle } from 'lucide-react';

export interface RefereeSubmissionQueueCardProps {
  queueItems?: ScoreApprovalRequestItem[];
  onSubmitCurrentMatchScore?: () => void;
  isSubmitting?: boolean;
}

export const RefereeSubmissionQueueCard: React.FC<RefereeSubmissionQueueCardProps> = ({
  queueItems = [],
  onSubmitCurrentMatchScore,
  isSubmitting = false
}) => {
  return (
    <div className="space-y-4">
      {/* Modification Security Guard Notice */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>최종 종합 순위 수정 불가</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          기록원 권한으로는 전교 종합 학급 순위 점수 데이터를 직접 수정하거나 조작할 수 없습니다. 상위 보안 등급(총괄 관리자)만 승인 및 변경 가능합니다.
        </p>
      </div>

      {/* Submission queue card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Send className="w-4 h-4 text-slate-500" />
            경기 결과 최종 승인 대기열
          </h3>
        </div>

        {queueItems.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            대기열에 등록된 완료 경기가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {queueItems.map((item) => (
              <div 
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-500">결과: {item.homeTeam} [{item.homeScore}] vs [{item.awayScore}] {item.awayTeam}</div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.status === 'APPROVED'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                }`}>
                  {item.status === 'APPROVED' ? '확정완료' : '승인대기'}
                </span>
              </div>
            ))}
          </div>
        )}

        {onSubmitCurrentMatchScore && (
          <button
            type="button"
            onClick={onSubmitCurrentMatchScore}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            현재 경기 최종 스코어 본부 제출
          </button>
        )}
      </div>
    </div>
  );
};
