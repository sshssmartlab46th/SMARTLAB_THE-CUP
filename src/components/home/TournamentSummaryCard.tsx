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

export const TournamentSummaryCard: React.FC<TournamentSummaryCardProps> = ({
  title = '대진표 요약',
  subtitle = '토너먼트 매치업',
  selectedSport = 'soccer',
  availableSports = [
    { type: 'soccer', label: '축구' },
    { type: 'basketball', label: '농구' }
  ],
  onSelectSport,
  matches = []
}) => {
  const semi1 = matches.find((m) => m.stage === 'semifinal_1');
  const semi2 = matches.find((m) => m.stage === 'semifinal_2');
  const finalMatch = matches.find((m) => m.stage === 'final');

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
                className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
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

      {matches.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          해당 종목에 등록된 토너먼트 대진표가 없습니다.
        </div>
      ) : (
        /* Bracket Visual */
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

          {/* Final match node */}
          <div className="w-full md:w-1/2">
            {finalMatch && (
              <div className="rounded-xl border-2 border-red-400 dark:border-emerald-500 p-3.5 bg-white dark:bg-slate-800/60 text-xs shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-emerald-400 mb-2">
                  <span>{finalMatch.roundName}</span>
                  {finalMatch.venue && (
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {finalMatch.venue}
                    </span>
                  )}
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
      )}
    </div>
  );
};
