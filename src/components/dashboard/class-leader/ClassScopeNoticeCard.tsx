import React from 'react';
import { Lock, Trophy, Users } from 'lucide-react';

export interface ClassScopeNoticeCardProps {
  allowedScopeText?: string;
  totalPoints?: number;
  currentRank?: number;
  registeredPlayersCount?: number;
  unassignedSubstitutesCount?: number;
}

export const ClassScopeNoticeCard: React.FC<ClassScopeNoticeCardProps> = ({
  allowedScopeText = '소속 학급 전용 채널',
  totalPoints,
  currentRank,
  registeredPlayersCount,
  unassignedSubstitutesCount
}) => {
  return (
    <div className="space-y-4">
      {/* Scope boundary warning notice */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
          <Lock className="w-3.5 h-3.5" />
          <span>타 학급 정보 접근 제한 안내</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          보안 및 공정한 경기 운영을 위해 타 학급의 선수 명단 편집이나 비공개 설정 정보는 보실 수 없습니다.
        </p>
        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 pt-1">
          허용된 스코프: [{allowedScopeText}]
        </div>
      </div>

      {/* Class statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>우리 반 종합 점수</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalPoints !== undefined ? `${totalPoints.toLocaleString()} pts` : '-'}
            </span>
            {currentRank !== undefined && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                종합 순위: {currentRank}위
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>출전 등록 완료 선수</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {registeredPlayersCount !== undefined ? `${registeredPlayersCount}명` : '-'}
            </span>
            {unassignedSubstitutesCount !== undefined && (
              <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                미배정 후보: {unassignedSubstitutesCount}명
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
