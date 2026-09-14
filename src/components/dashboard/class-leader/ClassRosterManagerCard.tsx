import React from 'react';
import { Plus, Edit2, AlertCircle } from 'lucide-react';

export interface ClassRosterPlayerItem {
  id: string;
  name: string;
  sportWithPosition: string; // e.g., '축구 (미드필더)', '이어달리기 (주자)'
  status: 'CONFIRMED' | 'WAITING' | 'INJURED_SUB';
  statusLabel: string; // e.g., '참가 확정', '대기중', '부상/교체대기'
  nextMatchTime: string; // e.g., '오후 2:00 vs 3-5반'
}

export interface ClassRosterManagerCardProps {
  roster?: ClassRosterPlayerItem[];
  onRegisterNew?: () => void;
  onEditPlayer?: (playerId: string) => void;
}

export const ClassRosterManagerCard: React.FC<ClassRosterManagerCardProps> = ({
  roster = [],
  onRegisterNew,
  onEditPlayer
}) => {
  const getStatusBadgeClass = (status: ClassRosterPlayerItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800';
      case 'INJURED_SUB':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800';
      default:
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          🏃 우리 반 출전 선수 등록 & 현황 관리
        </h3>
        {onRegisterNew && (
          <button
            type="button"
            onClick={onRegisterNew}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            신규 등록
          </button>
        )}
      </div>

      {roster.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          등록된 출전 선수가 없습니다. 신규 등록 버튼을 눌러 선수를 배정하세요.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="pb-2">이름</th>
                <th className="pb-2">출전 종목</th>
                <th className="pb-2">상태</th>
                <th className="pb-2">다음 매치</th>
                <th className="pb-2 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {roster.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-300">
                    {p.sportWithPosition}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(p.status)}`}>
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {p.nextMatchTime}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onEditPlayer?.(p.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
