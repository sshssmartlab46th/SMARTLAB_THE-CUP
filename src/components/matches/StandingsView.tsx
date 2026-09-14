import React, { useState } from 'react';
import { ClassStandingItem } from '../../types';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export interface StandingsViewItem extends ClassStandingItem {
  goldCount?: number;
  silverCount?: number;
  bronzeCount?: number;
}

interface StandingsViewProps {
  standings: StandingsViewItem[];
}

export const StandingsView: React.FC<StandingsViewProps> = ({ standings }) => {
  const [gradeFilter, setGradeFilter] = useState<'ALL' | '1' | '2' | '3'>('ALL');

  const filtered = standings.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Grade filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            상산고등학교 학급별 종합 순위 및 배점표
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            종목별 1위(금: 100점), 2위(은: 70점), 3위(동: 40점) 및 참가 점수 합산
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {[
            { key: 'ALL', label: '전체 학년' },
            { key: '1', label: '1학년' },
            { key: '2', label: '2학년' },
            { key: '3', label: '3학년' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGradeFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                gradeFilter === tab.key
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5 text-center w-14">순위</th>
              <th className="p-3.5">학급</th>
              <th className="p-3.5 text-center">금메달</th>
              <th className="p-3.5 text-center">은메달</th>
              <th className="p-3.5 text-center">동메달</th>
              <th className="p-3.5 text-right font-bold text-slate-900 dark:text-white">종합 점수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  집계된 순위 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-center">
                      {rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black inline-flex items-center justify-center shadow-xs">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black inline-flex items-center justify-center shadow-xs">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-400">{rank}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.classLabel || `${item.grade}학년 ${item.classNum}반`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.grade}학년
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-amber-500">
                      {item.goldCount ?? 0}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-400">
                      {item.silverCount ?? 0}
                    </td>
                    <td className="p-3.5 text-center font-bold text-amber-700">
                      {item.bronzeCount ?? 0}
                    </td>
                    <td className="p-3.5 text-right font-black font-mono text-sm sm:text-base text-red-600 dark:text-red-400">
                      {Number(item.points ?? (item as any).totalPoints ?? 0).toLocaleString()}P
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
