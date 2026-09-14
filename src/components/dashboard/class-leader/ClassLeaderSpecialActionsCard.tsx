import React from 'react';
import { Megaphone, HeartHandshake, Users, MessageSquare } from 'lucide-react';

export interface ClassLeaderSpecialActionsCardProps {
  onRequestCheers?: () => void;
  onCallAttendance?: () => void;
  onSendClassNotice?: () => void;
}

export const ClassLeaderSpecialActionsCard: React.FC<ClassLeaderSpecialActionsCardProps> = ({
  onRequestCheers,
  onCallAttendance,
  onSendClassNotice
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
          반장/대표 특수 관리 메뉴
        </h3>
      </div>

      <div className="space-y-3">
        {/* Action 1 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <HeartHandshake className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>우리 반 응원단 대단결 요청</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              스마트보드 실시간 한줄 응원 릴레이 버프 발동
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestCheers}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition shadow-xs"
          >
            응원 요청
          </button>
        </div>

        {/* Action 2 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Users className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>선수 집합 & Attendance 체크</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              경기 시작 전 출전 명단 선수들에게 집합 호출
            </p>
          </div>
          <button
            type="button"
            onClick={onCallAttendance}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition shadow-xs"
          >
            인원 호출
          </button>
        </div>

        {/* Action 3 */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>반 내부 긴급 단체공지 쓰기</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              소속 학급 학생 전용 연동 푸시 공지 발송
            </p>
          </div>
          <button
            type="button"
            onClick={onSendClassNotice}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shrink-0 transition shadow-xs"
          >
            공지 발송
          </button>
        </div>
      </div>
    </div>
  );
};
