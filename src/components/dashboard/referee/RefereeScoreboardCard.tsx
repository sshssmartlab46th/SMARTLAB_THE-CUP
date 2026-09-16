import React from 'react';
import { MatchItem } from '../../../types';
import { Pause, Play, StopCircle, Plus, Minus, AlertCircle } from 'lucide-react';

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
  if (!match) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-8 text-center text-slate-400 text-xs">
        현재 선택된 제어 대상 경기가 없습니다. 배정 목록에서 경기를 선택하세요.
      </div>
    );
  }

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border-2 border-red-500/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${match.timerRunning ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            [실시간 스코어 기록판] {match.title}
          </h3>
        </div>

        <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs">
          {formatElapsed(match.elapsedSeconds || 0)} {match.timerRunning ? 'LIVE' : 'STOP'}
        </span>
      </div>

      {/* Main interactive scoreboard */}
      <div className="grid grid-cols-3 items-center text-center gap-2">
        {/* Home Team controls */}
        <div className="space-y-3">
          <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {match.homeTeam}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateScore?.('home', -1)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition"
              title="점수 1점 감점"
            >
              -1
            </button>
            <span className="text-4xl sm:text-5xl font-black font-mono text-red-600 dark:text-red-400 min-w-[50px]">
              {match.homeScore}
            </span>
            <button
              type="button"
              onClick={() => onUpdateScore?.('home', 1)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition"
              title="점수 1점 득점"
            >
              +1
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            {onRecordGoal && (
              <button
                type="button"
                onClick={() => onRecordGoal('home')}
                className="px-2 py-1 rounded bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-[10px] font-bold text-red-700 dark:text-red-300 hover:bg-red-200 transition flex items-center gap-1 cursor-pointer"
                title="홈팀 득점자 선택 및 기록"
              >
                <span>⚽</span>
                <span>골 기록</span>
              </button>
            )}
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
          </div>
        </div>

        {/* Center match details */}
        <div className="space-y-1.5 px-2">
          <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full inline-block">
            {match.period || '경기 진행중'}
          </div>
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

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateScore?.('away', -1)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition"
              title="점수 1점 감점"
            >
              -1
            </button>
            <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white min-w-[50px]">
              {match.awayScore}
            </span>
            <button
              type="button"
              onClick={() => onUpdateScore?.('away', 1)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition"
              title="점수 1점 득점"
            >
              +1
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            {onRecordGoal && (
              <button
                type="button"
                onClick={() => onRecordGoal('away')}
                className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition flex items-center gap-1 cursor-pointer"
                title="원정팀 득점자 선택 및 기록"
              >
                <span>⚽</span>
                <span>골 기록</span>
              </button>
            )}
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
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onToggleTimer}
          className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          {match.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {match.timerRunning ? '타이머 일시정지 (PAUSE)' : '타이머 가동 (START)'}
        </button>

        <button
          type="button"
          onClick={onEndMatch}
          className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <StopCircle className="w-4 h-4" />
          경기 종료 (END MATCH)
        </button>
      </div>
    </div>
  );
};
