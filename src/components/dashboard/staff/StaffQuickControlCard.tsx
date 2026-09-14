import React from 'react';
import { LayoutGrid, Users, CheckSquare } from 'lucide-react';

export interface StaffQuickControlCardProps {
  onCheckFieldAssignments?: () => void;
  onManageStaffVolunteers?: () => void;
  onCheckConsumables?: () => void;
}

export const StaffQuickControlCard: React.FC<StaffQuickControlCardProps> = ({
  onCheckFieldAssignments,
  onManageStaffVolunteers,
  onCheckConsumables
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-slate-500" />
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
          학생회 및 진행 전용 신속 제어
        </h3>
      </div>

      <div className="space-y-3">
        {/* Item 1 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              경기장 및 심판 배치 현황판
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              축구장, 체육관, 강당의 각 경기 시간별 배치
            </p>
          </div>
          <button
            type="button"
            onClick={onCheckFieldAssignments}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shrink-0 transition"
          >
            배치 확인
          </button>
        </div>

        {/* Item 2 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              자원봉사 대동 및 인력 재할당
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              특정 경기 관중 통제 및 급수대 추가 배치
            </p>
          </div>
          <button
            type="button"
            onClick={onManageStaffVolunteers}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs shrink-0 transition"
          >
            인력 관리
          </button>
        </div>

        {/* Item 3 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              운영 소모품 재고 실시간 체크
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              경기용 공, 밴드, 부상 대비 보건 물품 부족 상황 기록
            </p>
          </div>
          <button
            type="button"
            onClick={onCheckConsumables}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition"
          >
            물품 체크
          </button>
        </div>
      </div>
    </div>
  );
};
