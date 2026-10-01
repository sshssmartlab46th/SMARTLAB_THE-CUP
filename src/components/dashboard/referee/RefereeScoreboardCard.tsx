import React from 'react';
import { MatchItem } from '../../../types';
import { Pause, Play, StopCircle, Plus, Minus, AlertCircle } from 'lucide-react';
import { getSportScoreMeta } from '../../../utils/sportScoreUtils';
import { formatElapsedSeconds, useLiveMatchTimer } from '../../../utils/timerUtils';

export interface RefereeScoreboardCardProps {
  match?: MatchItem | null;
  onUpdateScore?: (team: 'home' | 'away', delta: number) => void;
  onRecordGoal?: (team: 'home' | 'away') => void;
  onAddCard?: (team: 'home' | 'away', cardType: 'YELLOW' | 'RED') => void;
  onToggleTimer?: () => void;
  onEndMatch?: () => void;
}

export const RefereeScoreboardCard: React.FC<RefereeScoreboardCardProps> = ({
  match,
  onUpdateScore,
  onRecordGoal,
  onAddCard,
  onToggleTimer,
  onEndMatch
}) => {
  const liveElapsedSeconds = useLiveMatchTimer(match);

  if (!match) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-8 text-center text-slate-400 text-xs">
        현재 선택된 제어 대상 경기가 없습니다. 배정 목록에서 경기를 선택하세요.
      </div>
    );
  }

  const scoreMeta = getSportScoreMeta(match.sport);
  const isSoccer = match.sport === 'soccer';

  return (
    <div className="rounded-2xl border-2 border-red-500/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${match.timerRunning ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>[실시간 스코어 기록판]</span>
            <span>{match.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
              {scoreMeta.sportIcon} {scoreMeta.sportName}
            </span>
          </h3>
        </div>

        <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs">
          {formatElapsedSeconds(liveElapsedSeconds)} {match.timerRunning ? 'LIVE' : 'STOP'}
        </span>
      </div>

      {/* Main interactive scoreboard */}
      <div className="grid grid-cols-3 items-center text-center gap-2">
        {/* Home Team controls */}
        <div className="space-y-3">
          <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {match.homeTeam}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-1.5">
            {scoreMeta.quickDeltas.map((qd) => {
              const isPositive = qd.delta > 0;
              return (
                <button
                  key={`ref-home-${qd.label}`}
                  type="button"
                  onClick={() => onUpdateScore?.('home', qd.delta)}
                  disabled={!isPositive && (match.homeScore ?? 0) <= 0}
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition disabled:opacity-30 cursor-pointer ${
                    isPositive
                      ? (qd.delta >= 2
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white')
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                  }`}
                  title={`${match.homeTeam} ${qd.desc}`}
                >
                  {qd.label}
                </button>
              );
            })}
          </div>

          <div className="text-3xl sm:text-4xl font-black font-mono text-red-600 dark:text-red-400">
            {match.homeScore}{scoreMeta.scoreUnit}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-1.5">
            {onRecordGoal && (
              <button
                type="button"
                onClick={() => onRecordGoal('home')}
                className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-[11px] font-bold text-red-700 dark:text-red-300 hover:bg-red-200 transition flex items-center gap-1 cursor-pointer"
                title={`홈팀 ${scoreMeta.scoreNoun} 기록`}
              >
                <span>{scoreMeta.sportIcon}</span>
                <span>{scoreMeta.scoreNoun} 기록</span>
              </button>
            )}
            {isSoccer && (
              <>
                <button
                  type="button"
                  onClick={() => onAddCard?.('home', 'YELLOW')}
                  className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition"
                >
                  🟨 경고
                </button>
                <button
                  type="button"
                  onClick={() => onAddCard?.('home', 'RED')}
                  className="px-2 py-1 rounded bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-[10px] font-bold text-red-800 dark:text-red-300 hover:bg-red-200 transition"
                >
                  🟥 퇴장
                </button>
              </>
            )}
          </div>
        </div>

        {/* Center match details */}
        <div className="space-y-1.5 px-2">
          <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full inline-block">
            {match.period || '경기 진행중'}
          </div>
          {isSoccer && ((match.penaltyShootout && (match.homeScore === match.awayScore || match.isPenaltyShootout)) || match.period?.includes('승부차기')) && (
            <div className="px-2 py-0.5 rounded bg-slate-900 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black inline-flex items-center gap-1 shadow-xs">
              <span>PK</span>
              <span className="text-white">{match.penaltyShootout?.homeScore ?? 0} : {match.penaltyShootout?.awayScore ?? 0}</span>
            </div>
          )}
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {match.court || '경기장 지정'}
          </div>
          <div className="text-[11px] text-slate-400">
            상태: {match.status}
          </div>
        </div>

        {/* Away Team controls */}
        <div className="space-y-3">
          <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {match.awayTeam}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-1.5">
            {scoreMeta.quickDeltas.map((qd) => {
              const isPositive = qd.delta > 0;
              return (
                <button
                  key={`ref-away-${qd.label}`}
                  type="button"
                  onClick={() => onUpdateScore?.('away', qd.delta)}
                  disabled={!isPositive && (match.awayScore ?? 0) <= 0}
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition disabled:opacity-30 cursor-pointer ${
                    isPositive
                      ? (qd.delta >= 2
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white')
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                  }`}
                  title={`${match.awayTeam} ${qd.desc}`}
                >
                  {qd.label}
                </button>
              );
            })}
          </div>

          <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white">
            {match.awayScore}{scoreMeta.scoreUnit}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-1.5">
            {onRecordGoal && (
              <button
                type="button"
                onClick={() => onRecordGoal('away')}
                className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition flex items-center gap-1 cursor-pointer"
                title={`원정팀 ${scoreMeta.scoreNoun} 기록`}
              >
                <span>{scoreMeta.sportIcon}</span>
                <span>{scoreMeta.scoreNoun} 기록</span>
              </button>
            )}
            {isSoccer && (
              <>
                <button
                  type="button"
                  onClick={() => onAddCard?.('away', 'YELLOW')}
                  className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition"
                >
                  🟨 경고
                </button>
                <button
                  type="button"
                  onClick={() => onAddCard?.('away', 'RED')}
                  className="px-2 py-1 rounded bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-[10px] font-bold text-red-800 dark:text-red-300 hover:bg-red-200 transition"
                >
                  🟥 퇴장
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onToggleTimer}
          className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          {match.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {match.timerRunning ? '타이머 일시정지 (PAUSE)' : '타이머 가동 (START)'}
        </button>

        <button
          type="button"
          onClick={onEndMatch}
          className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <StopCircle className="w-4 h-4" />
          경기 공식 종료 (END MATCH)
        </button>
      </div>
    </div>
  );
};

