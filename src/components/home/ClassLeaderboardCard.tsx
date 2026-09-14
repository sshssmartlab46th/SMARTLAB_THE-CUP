import React from 'react';
import { ClassStandingItem } from '../../types';

export interface ClassLeaderboardCardProps {
  standings?: ClassStandingItem[];
  onViewAll?: () => void;
}

export const ClassLeaderboardCard: React.FC<ClassLeaderboardCardProps> = ({
  standings = [],
  onViewAll
}) => {
  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
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
        {onViewAll && standings.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            전체보기
          </button>
        )}
      </div>

      {standings.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          집계된 학급 종합 순위 데이터가 없습니다.
        </div>
      ) : (
        <>
          {/* Top 3 Podium Layout */}
          <div className="grid grid-cols-3 gap-2 items-end mb-4 pt-1">
            {/* 2nd Place */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-2.5 text-center flex flex-col items-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate w-full">
                {second ? (second.classLabel || `${second.grade}학년 ${second.classNum}반`) : '-'}
              </span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                2
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {second ? `${second.points.toLocaleString()} pts` : '-'}
              </span>
            </div>

            {/* 1st Place (Elevated with red/green border) */}
            <div className="rounded-xl border-2 border-red-500 dark:border-emerald-500 bg-white dark:bg-slate-800/80 p-3 text-center flex flex-col items-center -translate-y-1.5 shadow-xs">
              <span className="text-xs font-bold text-red-600 dark:text-emerald-400 mb-1 truncate w-full">
                {first ? (first.classLabel || `${first.grade}학년 ${first.classNum}반`) : '-'}
              </span>
              <span className="text-2xl font-black text-red-600 dark:text-emerald-400 mb-0.5">
                1
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-emerald-400">
                {first ? `${first.points.toLocaleString()} pts` : '-'}
              </span>
            </div>

            {/* 3rd Place */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-2.5 text-center flex flex-col items-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate w-full">
                {third ? (third.classLabel || `${third.grade}학년 ${third.classNum}반`) : '-'}
              </span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                3
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {third ? `${third.points.toLocaleString()} pts` : '-'}
              </span>
            </div>
          </div>

          {/* 4th, 5th, etc. list */}
          {remaining.length > 0 && (
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
                      {item.classLabel || `${item.grade}학년 ${item.classNum}반`}
                    </span>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                    {item.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
