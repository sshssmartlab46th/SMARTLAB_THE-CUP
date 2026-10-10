import React, { useState } from 'react';
import { ClassStandingItem } from '../../types';
import { Trophy, Download, FileText, Medal, Award } from 'lucide-react';
import { exportStandingsToCSV, exportStandingsToPDF } from '../../utils/standingsReportExporter';

export interface StandingsViewItem extends ClassStandingItem {
  goldCount?: number;
  silverCount?: number;
  bronzeCount?: number;
  wins?: number;
  draws?: number;
  losses?: number;
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

  const handleExportCSV = () => {
    exportStandingsToCSV(standings, { gradeFilter });
  };

  const handleExportPDF = () => {
    exportStandingsToPDF(standings, { gradeFilter });
  };

  const top3 = filtered.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header & Grade filter & Export buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            상산고등학교 학급별 종합 순위 및 배점표
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            종목별 우승/준우승/3위 배점 및 경기 승패, 참가 점수 자동 집계
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto justify-between md:justify-end">
          {/* Grade filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  gradeFilter === tab.key
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
              title="CSV 엑셀 파일 내보내기"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-xs"
              title="시상용 최종 리포트 (PDF / 인쇄)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>시상 리포트 (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Award Summary Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((item, idx) => {
            const rank = idx + 1;
            const badgeLabel =
              gradeFilter === 'ALL'
                ? rank === 1
                  ? '종합 우승'
                  : rank === 2
                  ? '종합 준우승'
                  : '종합 3위'
                : `${item.grade}학년 ${rank === 1 ? '우승' : rank === 2 ? '준우승' : '3위'}`;

            const icon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉';
            const bgGradient =
              rank === 1
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-600/40'
                : rank === 2
                ? 'bg-gradient-to-br from-slate-400/10 via-slate-400/5 to-transparent border-slate-300 dark:border-slate-600/40'
                : 'bg-gradient-to-br from-amber-700/10 via-amber-700/5 to-transparent border-amber-600/30 dark:border-amber-700/40';

            return (
              <div
                key={`top3-${item.id}`}
                className={`p-3.5 rounded-2xl border ${bgGradient} bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {badgeLabel}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {item.classLabel || `${item.grade}-${item.classNum}반`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>🥇 {item.goldCount ?? 0}</span>
                    <span>🥈 {item.silverCount ?? 0}</span>
                    <span>🥉 {item.bronzeCount ?? 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">총점</div>
                  <div className="text-base sm:text-lg font-black font-mono text-red-600 dark:text-red-400">
                    {Number(item.points ?? (item as any).totalPoints ?? 0).toLocaleString()}P
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <th className="p-3.5 text-center hidden sm:table-cell">전적(승/무/패)</th>
              <th className="p-3.5 text-right font-bold text-slate-900 dark:text-white">종합 점수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  집계된 순위 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const rank = idx + 1;
                const wins = (item as any).wins ?? 0;
                const draws = (item as any).draws ?? 0;
                const losses = (item as any).losses ?? 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-center">
                      {rank === 1 ? (
                        <span className="text-lg inline-flex items-center justify-center filter drop-shadow-xs" title="1위 우승">
                          🏆
                        </span>
                      ) : rank === 2 ? (
                        <span className="text-lg inline-flex items-center justify-center filter drop-shadow-xs" title="2위 준우승">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="text-lg inline-flex items-center justify-center filter drop-shadow-xs" title="3위 3위">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-400">{rank}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.classLabel || `${item.grade}학년 ${item.classNum}반`}
                        </span>
                        {gradeFilter === 'ALL' && rank <= 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded-full font-extrabold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            {rank === 1 ? '우승' : rank === 2 ? '준우승' : '3위'}
                          </span>
                        )}
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
                    <td className="p-3.5 text-center text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">
                      {wins}승 {draws}무 {losses}패
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

      <div className="text-center py-2 text-[11px] text-slate-400">
        made by SMARTLAB
      </div>
    </div>
  );
};
