import React from 'react';
import { Wrench, PlusCircle, BellRing, UserCheck } from 'lucide-react';

export interface AdminQuickActionsCardProps {
  onCreateMatch?: () => void;
  onSendPushNotice?: () => void;
  onManagePermissions?: () => void;
}

export const AdminQuickActionsCard: React.FC<AdminQuickActionsCardProps> = ({
  onCreateMatch,
  onSendPushNotice,
  onManagePermissions
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-slate-500" />
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
          총괄 관리 기능 바로가기
        </h3>
      </div>

      <div className="space-y-3">
        {/* Action 1: 새 경기 및 대진 등록 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <PlusCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>새 경기 및 대진 등록</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              각 학년별 토너먼트 리그 대진 자동/수동 짜기
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateMatch}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shrink-0 transition"
          >
            생성하기
          </button>
        </div>

        {/* Action 2: 전체 긴급 방송 푸시 공지 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <BellRing className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>전체 긴급 방송 푸시 공지</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              교내 스마트보드 및 학생 모바일앱 푸시 알림
            </p>
          </div>
          <button
            type="button"
            onClick={onSendPushNotice}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition"
          >
            푸시 전송
          </button>
        </div>

        {/* Action 3: 사용자 권한 & 역할 제어 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>사용자 권한 & 역할 제어</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              학생회 스태프, 심판진 및 학급 반대표 권한 변경
            </p>
          </div>
          <button
            type="button"
            onClick={onManagePermissions}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium shrink-0 transition"
          >
            권한 관리
          </button>
        </div>
      </div>
    </div>
  );
};
