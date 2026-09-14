import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile } from '../../types';
import { Heart, Flame, ChevronRight, Volume2, Sparkles, Play, Clock } from 'lucide-react';
import { listenCheers, sendCheer, sendLiveReaction, startMatch, parseMatchStartTime, formatKSTTime } from '../../services/firebaseService';

export interface LiveMatchHeroCardProps {
  match?: MatchItem | null;
  currentUser?: UserProfile | null;
  cheerVotes?: number;
  onVoteCheer?: () => void;
  isVoting?: boolean;
  onOpenLiveScore?: () => void;
  onCheerReaction?: (reactionType: 'fire' | 'clap' | 'heart' | 'cheer') => void;
  onToggleReminder?: (matchId: string) => void;
  isReminderSet?: boolean;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export const LiveMatchHeroCard: React.FC<LiveMatchHeroCardProps> = ({
  match,
  currentUser,
  onOpenLiveScore,
  onCheerReaction,
}) => {
  const [cheerCounts, setCheerCounts] = useState<{ home: number; away: number }>({ home: 0, away: 0 });
  const [isCheering, setIsCheering] = useState(false);
  const [cheeredMessage, setCheeredMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Listen to live cheer counts from Firebase
  useEffect(() => {
    if (!match?.id) return;
    const unsubscribe = listenCheers(match.id, (c) => {
      setCheerCounts({ home: c.homeCheers || 0, away: c.awayCheers || 0 });
    });
    return () => unsubscribe();
  }, [match?.id]);

  if (!match) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <span className="text-3xl mb-2">⚽</span>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          진행 중인 실시간 경기
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          현재 진행 중인 경기가 없습니다. 오늘의 경기 일정을 확인하세요.
        </p>
      </div>
    );
  }

  const homeLabel = match.homeTeam || (match.homeClass ? `${match.homeClass}반` : '홈팀');
  const awayLabel = match.awayTeam || (match.awayClass ? `${match.awayClass}반` : '원정팀');
  const matchPeriod = match.period || '';
  const matchCourt = match.court || match.location || '';
  const matchRound = match.round || match.title || '';

  const isLive = match.status === 'LIVE';
  const isPaused = match.status === 'PAUSED';
  const isScheduled = match.status === 'SCHEDULED';
  const startTimeEpoch = parseMatchStartTime(match.startTime);
  const isTimeArrived = Boolean(startTimeEpoch && startTimeEpoch <= Date.now());

  const canStartMatch = Boolean(
    isScheduled && currentUser && ['admin', 'referee', 'student_council'].includes(currentUser.role)
  );

  const handleStartThisMatch = async () => {
    if (!match?.id || isStarting) return;
    setIsStarting(true);
    try {
      await startMatch(match.id, match.sport);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  // Determine user class affinity
  const userClassNum = currentUser?.classNum;
  const isHomeMyClass = Boolean(
    userClassNum &&
    (match.homeClass === userClassNum ||
     homeLabel.includes(`${userClassNum}반`) ||
     homeLabel.includes(`-${userClassNum}`))
  );
  const isAwayMyClass = Boolean(
    userClassNum &&
    (match.awayClass === userClassNum ||
     awayLabel.includes(`${userClassNum}반`) ||
     awayLabel.includes(`-${userClassNum}`))
  );

  const preferredTeam: 'home' | 'away' = isAwayMyClass ? 'away' : 'home';
  const preferredLabel = isAwayMyClass ? awayLabel : isHomeMyClass ? homeLabel : '우리 학급';
  const totalCheers = (cheerCounts.home || 0) + (cheerCounts.away || 0);

  const spawnParticle = (emoji: string, e?: React.MouseEvent) => {
    const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect?.() || { left: 150, top: 100 };
    const newP: FloatingParticle = {
      id: Date.now() + Math.random(),
      x: (e?.clientX ?? rect.left) + (Math.random() * 40 - 20),
      y: (e?.clientY ?? rect.top) - 10,
      emoji
    };
    setParticles((prev) => [...prev.slice(-10), newP]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newP.id));
    }, 1200);
  };

  const handleCheer = async (team: 'home' | 'away', e?: React.MouseEvent) => {
    if (!match?.id || isCheering) return;
    setIsCheering(true);

    // Optimistic UI update
    setCheerCounts((prev) => ({
      ...prev,
      [team]: (prev[team] || 0) + 1
    }));

    const emoji = team === 'home' ? '❤️' : '🔥';
    spawnParticle(emoji, e);

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch { /* ignore */ }
    }

    try {
      await sendCheer(match.id, team, emoji);
      await sendLiveReaction(team === 'home' ? 'heart' : 'fire');
      onCheerReaction?.(team === 'home' ? 'heart' : 'fire');

      const targetName = team === 'home' ? homeLabel : awayLabel;
      setCheeredMessage(`${targetName}에 응원을 보냈습니다! ${emoji}`);
      setTimeout(() => setCheeredMessage(null), 2500);
    } catch (err) {
      console.error('Cheer error:', err);
    } finally {
      setIsCheering(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-red-500/80 dark:border-emerald-500 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Floating Particles Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
            className="absolute text-2xl animate-bounce-out pointer-events-none select-none transition-all duration-1000"
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${
            isLive ? 'bg-red-600 dark:bg-emerald-500 animate-pulse' :
            isTimeArrived ? 'bg-amber-500 animate-pulse' :
            isPaused ? 'bg-amber-400' : 'bg-blue-500'
          }`} />
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            {isLive ? '진행 중인 실시간 경기' : isTimeArrived ? '시작 시간 도달 경기 (대기중)' : isPaused ? '일시중지된 경기' : '다음 예정 경기'}
            {match.sport && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                {match.sport}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-sm text-[11px] font-black tracking-wider uppercase ${
            isLive
              ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950'
              : isTimeArrived
              ? 'bg-amber-500 text-white animate-pulse'
              : isPaused
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          }`}>
            {isLive ? 'LIVE' : isTimeArrived ? '시간 도달' : isPaused ? 'PAUSED' : 'SCHEDULED'}
          </span>
        </div>
      </div>

      {/* Main Matchup Layout */}
      <div className="grid grid-cols-3 items-center text-center my-3 py-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
        {/* Home Team */}
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-center gap-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {homeLabel}
            </h3>
            {isHomeMyClass && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">
                우리반
              </span>
            )}
          </div>
          <div className="text-4xl sm:text-6xl font-black font-mono text-red-600 dark:text-emerald-400">
            {match.homeScore ?? 0}
          </div>
          <button
            type="button"
            onClick={(e) => handleCheer('home', e)}
            className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <Heart className="w-3 h-3 fill-current" />
            <span>{cheerCounts.home.toLocaleString()}표</span>
          </button>
        </div>

        {/* Center Details */}
        <div className="space-y-1.5 px-1">
          {matchPeriod ? (
            <div className="text-xs font-bold text-red-600 dark:text-emerald-400 bg-red-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block">
              {matchPeriod}
            </div>
          ) : isScheduled ? (
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{match.startTime ? formatKSTTime(match.startTime) : '시작 전'}</span>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500">
              VS
            </div>
          )}
          {matchCourt && (
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {matchCourt}
            </div>
          )}
          {matchRound && (
            <div className="text-[11px] text-slate-400">
              {matchRound}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-center gap-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {awayLabel}
            </h3>
            {isAwayMyClass && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                우리반
              </span>
            )}
          </div>
          <div className="text-4xl sm:text-6xl font-black font-mono text-slate-900 dark:text-slate-100">
            {match.awayScore ?? 0}
          </div>
          <button
            type="button"
            onClick={(e) => handleCheer('away', e)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <Flame className="w-3 h-3 fill-current" />
            <span>{cheerCounts.away.toLocaleString()}표</span>
          </button>
        </div>
      </div>

      {/* Cheering Toast Banner */}
      {cheeredMessage && (
        <div className="mb-3 p-2 text-center text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl animate-fade-in flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{cheeredMessage}</span>
        </div>
      )}

      {/* Primary Action: 우리 학급 실시간 응원하기 Button */}
      <div className="space-y-2 mt-4">
        {canStartMatch && (
          <button
            type="button"
            onClick={handleStartThisMatch}
            disabled={isStarting}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer ${
              isTimeArrived
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {isTimeArrived
                ? '▶ 시작 시각 도달! 공식 경기 즉시 시작 (LIVE 전환)'
                : '▶ 공식 경기 지금 시작하기 (LIVE 전환)'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => handleCheer(preferredTeam, e)}
          disabled={isCheering}
          className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <Heart className="w-4 h-4 fill-current animate-pulse text-white dark:text-slate-950" />
          <span>
            {isHomeMyClass || isAwayMyClass
              ? `우리 학급 (${preferredLabel}) 실시간 응원하기 (+1❤️)`
              : `우리 학급 실시간 응원하기 (${totalCheers.toLocaleString()}표)`}
          </span>
        </button>

        {/* Secondary controls: Both team cheer buttons & Open Scoreboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => handleCheer('home', e)}
            className="py-2 px-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
            <span className="truncate">{homeLabel} ({cheerCounts.home}표)</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleCheer('away', e)}
            className="py-2 px-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-current text-blue-500" />
            <span className="truncate">{awayLabel} ({cheerCounts.away}표)</span>
          </button>

          {onOpenLiveScore && (
            <button
              type="button"
              onClick={onOpenLiveScore}
              className="col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <span>경기 센터</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
