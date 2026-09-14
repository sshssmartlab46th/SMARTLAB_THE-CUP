import React from 'react';
import { ClassStandingItem } from '../../types';

export interface ClassLeaderboardCardProps {
  standings?: ClassStandingItem[];
  onViewAll?: () => void;
}

const DEFAULT_STANDINGS: ClassStandingItem[] = [
  { id: '302', rank: 1, classLabel: '3-2반', grade: '3', classNum: '2', points: 1200, goldCount: 2, silverCount: 1, bronzeCount: 0 },
  { id: '305', rank: 2, classLabel: '3-5반', grade: '3', classNum: '5', points: 1050, goldCount: 1, silverCount: 2, bronzeCount: 0 },
  { id: '201', rank: 3, classLabel: '2-1반', grade: '2', classNum: '1', points: 980, goldCount: 1, silverCount: 1, bronzeCount: 1 },
  { id: '103', rank: 4, classLabel: '1학년 3반', grade: '1', classNum: '3', points: 910, goldCount: 1, silverCount: 0, bronzeCount: 1 },
  { id: '206', rank: 5, classLabel: '2학년 6반', grade: '2', classNum: '6', points: 850, goldCount: 0, silverCount: 1, bronzeCount: 2 }
];

export const ClassLeaderboardCard: React.FC<ClassLeaderboardCardProps> = ({
  standings = [],
  onViewAll
}) => {
  const activeList = standings.length > 0 ? standings : DEFAULT_STANDINGS;
  const sorted = [...activeList].sort((a, b) => a.rank - b.rank);
  const first = sorted.find((s) => s.rank === 1);
  const second = sorted.find((s) => s.rank === 2);
  const third = sorted.find((s) => s.rank === 3);
  const remaining = sorted.filter((s) => s.rank > 3).slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
          종합 학급 순위
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            전체보기
          </button>
        )}
      </div>

      {/* Top 3 Podium Layout matching PDF */}
      <div className="grid grid-cols-3 gap-2 items-end mb-4 pt-1">
        {/* 2nd Place */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-2.5 text-center flex flex-col items-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate w-full">
            {second?.classLabel || '3-5반'}
          </span>
          <span className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-0.5">
            2
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {second ? `${second.points.toLocaleString()} pts` : '1,050 pts'}
          </span>
        </div>

        {/* 1st Place (Elevated with red/green border matching PDF) */}
        <div className="rounded-xl border-2 border-red-500 dark:border-emerald-500 bg-white dark:bg-slate-800/80 p-3 text-center flex flex-col items-center -translate-y-1.5 shadow-xs">
          <span className="text-xs font-bold text-red-600 dark:text-emerald-400 mb-1 truncate w-full">
            {first?.classLabel || '3-2반'}
          </span>
          <span className="text-2xl font-black text-red-600 dark:text-emerald-400 mb-0.5">
            1
          </span>
          <span className="text-xs font-bold text-red-600 dark:text-emerald-400">
            {first ? `${first.points.toLocaleString()} pts` : '1,200 pts'}
          </span>
        </div>

        {/* 3rd Place */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-2.5 text-center flex flex-col items-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate w-full">
            {third?.classLabel || '2-1반'}
          </span>
          <span className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-0.5">
            3
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {third ? `${third.points.toLocaleString()} pts` : '980 pts'}
          </span>
        </div>
      </div>

      {/* 4th, 5th list matching PDF */}
      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        {remaining.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between text-xs py-1 px-1"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 w-3">
                {item.rank}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {item.classLabel}
              </span>
            </div>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
              {item.points.toLocaleString()} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
