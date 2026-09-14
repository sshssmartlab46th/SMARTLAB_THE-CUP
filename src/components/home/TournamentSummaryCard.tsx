import React from 'react';
import { SportType } from '../../types';

export interface TournamentMatchNode {
  stage: 'semifinal_1' | 'semifinal_2' | 'final' | string;
  roundName: string;
  teamA: { name: string; score: number | string };
  teamB: { name: string; score: number | string };
  venue?: string;
  statusText?: string;
  isLive?: boolean;
}

export interface TournamentSummaryCardProps {
  title?: string;
  subtitle?: string;
  selectedSport?: SportType;
  availableSports?: { type: SportType; label: string }[];
  onSelectSport?: (sport: SportType) => void;
  matches?: TournamentMatchNode[];
}

const DEFAULT_BRACKET: TournamentMatchNode[] = [
  {
    stage: 'semifinal_1',
    roundName: '준결승 1 (종료)',
    teamA: { name: '3학년 2반', score: 3 },
    teamB: { name: '3학년 3반', score: 1 }
  },
  {
    stage: 'semifinal_2',
    roundName: '준결승 2 (종료)',
    teamA: { name: '3학년 1반', score: 0 },
    teamB: { name: '3학년 5반', score: 2 }
  },
  {
    stage: 'final',
    roundName: '🏆 결승전 진행중',
    venue: '대운동장',
    statusText: '진행중',
    isLive: true,
    teamA: { name: '3학년 2반', score: 2 },
    teamB: { name: '3학년 5반', score: 1 }
  }
];

export const TournamentSummaryCard: React.FC<TournamentSummaryCardProps> = ({
  title = '축구 대진표 요약 (남자부)',
  subtitle = '3학년 토너먼트 매치업',
  selectedSport = 'soccer',
  availableSports = [
    { type: 'soccer', label: '축구' },
    { type: 'basketball', label: '농구' }
  ],
  onSelectSport,
  matches = []
}) => {
  const nodes = matches.length > 0 ? matches : DEFAULT_BRACKET;
  const semi1 = nodes.find((m) => m.stage === 'semifinal_1');
  const semi2 = nodes.find((m) => m.stage === 'semifinal_2');
  const finalMatch = nodes.find((m) => m.stage === 'final');

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      {/* Header & Sport Tabs */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {availableSports.length > 0 && (
          <div className="flex items-center gap-1">
            {availableSports.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => onSelectSport?.(s.type)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  selectedSport === s.type
                    ? 'bg-red-600 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bracket Visual matching PDF */}
      <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
        {/* Semifinals column */}
        <div className="w-full md:w-1/2 space-y-3">
          {semi1 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/40 text-xs">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                {semi1.roundName}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-900 dark:text-slate-100 font-semibold">
                  <span>{semi1.teamA.name}</span>
                  <span className="font-mono text-red-600 dark:text-emerald-400 font-bold">{semi1.teamA.score}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 font-medium">
                  <span>{semi1.teamB.name}</span>
                  <span className="font-mono">{semi1.teamB.score}</span>
                </div>
              </div>
            </div>
          )}

          {semi2 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/40 text-xs">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                {semi2.roundName}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 font-medium">
                  <span>{semi2.teamA.name}</span>
                  <span className="font-mono">{semi2.teamA.score}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 dark:text-slate-100 font-semibold">
                  <span>{semi2.teamB.name}</span>
                  <span className="font-mono text-red-600 dark:text-emerald-400 font-bold">{semi2.teamB.score}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Connecting visual bridge */}
        <div className="hidden md:flex items-center justify-center shrink-0 w-6">
          <div className="w-full h-0.5 bg-red-400 dark:bg-emerald-500/80" />
        </div>

        {/* Final match node matching PDF */}
        <div className="w-full md:w-1/2">
          {finalMatch && (
            <div className="rounded-xl border-2 border-red-400 dark:border-emerald-500 p-3.5 bg-white dark:bg-slate-800/60 text-xs shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-emerald-400 mb-2">
                <span>{finalMatch.roundName}</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {finalMatch.venue || '대운동장'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <span>{finalMatch.teamA.name}</span>
                  <span className="font-mono text-red-600 dark:text-emerald-400 font-black">
                    {finalMatch.teamA.score}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <span>{finalMatch.teamB.name}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {finalMatch.teamB.score}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
