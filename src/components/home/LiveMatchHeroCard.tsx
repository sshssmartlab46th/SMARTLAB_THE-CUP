import React from 'react';
import { MatchItem } from '../../types';
import { Heart } from 'lucide-react';

export interface LiveMatchHeroCardProps {
  match?: MatchItem | null;
  cheerVotes?: number;
  onVoteCheer?: () => void;
  isVoting?: boolean;
}

export const LiveMatchHeroCard: React.FC<LiveMatchHeroCardProps> = ({
  match,
  cheerVotes = 124,
  onVoteCheer,
  isVoting = false
}) => {
  if (!match) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <span className="text-2xl mb-2">⚽</span>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          진행 중인 실시간 경기
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          현재 진행 중인 경기가 없습니다.
        </p>
      </div>
    );
  }

  const homeLabel = match.homeTeam || match.homeClass || '3학년 2반';
  const awayLabel = match.awayTeam || match.awayClass || '3학년 5반';
  const matchPeriod = match.period || '후반 15분';
  const matchCourt = match.court || '대운동장';
  const matchRound = match.round || match.title || '남학생 결승';

  return (
    <div className="rounded-2xl border-2 border-red-400 dark:border-emerald-500 bg-white dark:bg-slate-900 p-6 shadow-xs relative transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-emerald-500 inline-block" />
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            진행 중인 실시간 경기
          </span>
        </div>

        <span className="px-2.5 py-0.5 rounded-sm bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[11px] font-black tracking-wider uppercase">
          LIVE
        </span>
      </div>

      {/* Main Matchup Layout matching PDF */}
      <div className="grid grid-cols-3 items-center text-center my-3">
        {/* Home Team */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {homeLabel}
          </h3>
          <div className="text-5xl sm:text-6xl font-black font-mono text-red-600 dark:text-emerald-400">
            {match.homeScore ?? 2}
          </div>
        </div>

        {/* Center Details */}
        <div className="space-y-1 px-1">
          <div className="text-xs font-bold text-red-600 dark:text-emerald-400">
            {matchPeriod}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {matchCourt}
          </div>
          <div className="text-[11px] text-slate-400">
            {matchRound}
          </div>
        </div>

        {/* Away Team */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {awayLabel}
          </h3>
          <div className="text-5xl sm:text-6xl font-black font-mono text-slate-900 dark:text-slate-100">
            {match.awayScore ?? 1}
          </div>
        </div>
      </div>

      {/* Action Button matching PDF */}
      <div className="mt-5">
        <button
          type="button"
          onClick={onVoteCheer}
          disabled={isVoting}
          className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>우리 학급 실시간 응원하기 ({cheerVotes.toLocaleString()}표)</span>
        </button>
      </div>
    </div>
  );
};
