import React from 'react';
import { ClassStandingItem } from '../../types';

export interface ClassLeaderboardCardProps {
  standings?: ClassStandingItem[];
  onViewAll?: () => void;
  onOpenFullStandings?: () => void;
}

export const ClassLeaderboardCard: React.FC<ClassLeaderboardCardProps> = ({
  standings = [],
  onViewAll,
  onOpenFullStandings
}) => {
  const handleViewAll = onOpenFullStandings || onViewAll;
  const sorted = [...standings].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  const first = sorted.find((s) => s.rank === 1);
  const second = sorted.find((s) => s.rank === 2);
  const third = sorted.find((s) => s.rank === 3);
  const remaining = sorted.filter((s) => (s.rank || 0) > 3).slice(0, 3);

  const getPointsText = (item?: any) => {
    if (!item) return '-';
    const val = item.points ?? item.totalPoints;
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val || 0);
    return `${num.toLocaleString()} pts`;
  };

  const getLabel = (item?: any) => {
    if (!item) return '-';
    return item.classLabel || item.className || (item.grade && item.classNum ? `${item.grade}학년 ${item.classNum}반` : '-');
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
          종합 학급 순위
        </h2>
        {handleViewAll && standings.length > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
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
                {getLabel(second)}
              </span>
              <span className="text-2xl mb-0.5 filter drop-shadow-xs" role="img" aria-label="2위 은메달">
                🥈
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {second ? getPointsText(second) : '-'}
              </span>
            </div>

            {/* 1st Place (Elevated with red border) */}
            <div className="rounded-xl border-2 border-red-500 dark:border-emerald-500 bg-white dark:bg-slate-800/80 p-3 text-center flex flex-col items-center -translate-y-1.5 shadow-xs">
              <span className="text-xs font-bold text-red-600 dark:text-emerald-400 mb-1 truncate w-full">
                {getLabel(first)}
              </span>
              <span className="text-3xl mb-0.5 filter drop-shadow-xs" role="img" aria-label="1위 트로피">
                🏆
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-emerald-400">
                {first ? getPointsText(first) : '-'}
              </span>
            </div>

            {/* 3rd Place */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-2.5 text-center flex flex-col items-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate w-full">
                {getLabel(third)}
              </span>
              <span className="text-2xl mb-0.5 filter drop-shadow-xs" role="img" aria-label="3위 동메달">
                🥉
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {third ? getPointsText(third) : '-'}
              </span>
            </div>
          </div>

          {/* 4th, 5th, etc. list */}
          {remaining.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              {remaining.map((item) => (
                <div 
                  key={item.id || `${item.grade}-${item.classNum}`}
                  className="flex items-center justify-between text-xs py-1 px-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 w-3">
                      {item.rank}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {getLabel(item)}
                    </span>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                    {getPointsText(item)}
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
