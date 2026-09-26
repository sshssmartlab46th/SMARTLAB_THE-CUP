import React, { useState } from 'react';
import { MatchItem, PenaltyShootoutData, PenaltyShootoutKick, PenaltyKickResult } from '../../types';
import { updateMatch } from '../../services/firebaseService';
import { Trophy, Check, X as XIcon, RotateCcw, Plus, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface PenaltyShootoutBoardProps {
  match: MatchItem;
  canEdit?: boolean;
  onNotice?: (msg: string) => void;
}

export const PenaltyShootoutBoard: React.FC<PenaltyShootoutBoardProps> = ({
  match,
  canEdit = false,
  onNotice
}) => {
  const isSoccer = match.sport === 'soccer';
  const shootout = match.penaltyShootout;
  const isDraw = match.homeScore === match.awayScore;

  // Local state for optimistic update & spinner
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize or fallback shootout data
  const defaultKicks = (count: number = 5): PenaltyShootoutKick[] => {
    return Array.from({ length: count }, (_, i) => ({
      order: i + 1,
      result: 'pending' as PenaltyKickResult
    }));
  };

  const homeKicks = shootout?.homeKicks && shootout.homeKicks.length > 0
    ? shootout.homeKicks
    : defaultKicks(5);

  const awayKicks = shootout?.awayKicks && shootout.awayKicks.length > 0
    ? shootout.awayKicks
    : defaultKicks(5);

  const homePkScore = shootout?.homeScore ?? homeKicks.filter(k => k.result === 'scored').length;
  const awayPkScore = shootout?.awayScore ?? awayKicks.filter(k => k.result === 'scored').length;

  // Handle kick result change
  const handleSetKickResult = async (team: 'home' | 'away', order: number, result: PenaltyKickResult) => {
    if (!canEdit || isUpdating) return;
    setIsUpdating(true);

    try {
      const currentHomeKicks = [...homeKicks];
      const currentAwayKicks = [...awayKicks];

      if (team === 'home') {
        const idx = currentHomeKicks.findIndex(k => k.order === order);
        if (idx >= 0) {
          currentHomeKicks[idx] = { ...currentHomeKicks[idx], result };
        } else {
          currentHomeKicks.push({ order, result });
        }
      } else {
        const idx = currentAwayKicks.findIndex(k => k.order === order);
        if (idx >= 0) {
          currentAwayKicks[idx] = { ...currentAwayKicks[idx], result };
        } else {
          currentAwayKicks.push({ order, result });
        }
      }

      const calculatedHomeScore = currentHomeKicks.filter(k => k.result === 'scored').length;
      const calculatedAwayScore = currentAwayKicks.filter(k => k.result === 'scored').length;

      const newShootoutData: PenaltyShootoutData = {
        isActive: true,
        homeScore: calculatedHomeScore,
        awayScore: calculatedAwayScore,
        homeKicks: currentHomeKicks,
        awayKicks: currentAwayKicks,
        winner: calculatedHomeScore > calculatedAwayScore ? 'home' : calculatedAwayScore > calculatedHomeScore ? 'away' : undefined
      };

      await updateMatch(match.id, {
        isPenaltyShootout: true,
        period: '승부차기',
        penaltyShootout: newShootoutData
      });

      if (onNotice) {
        onNotice(`[승부차기] ${team === 'home' ? match.homeTeam : match.awayTeam} ${order}번 키커 ${result === 'scored' ? '득점 성공' : result === 'missed' ? '실축' : '초기화'}`);
      }
    } catch (e) {
      console.error('[PenaltyShootout] Error setting kick result:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Add sudden death kick round (6th, 7th...)
  const handleAddSuddenDeathRound = async () => {
    if (!canEdit || isUpdating) return;
    setIsUpdating(true);

    try {
      const nextOrder = Math.max(homeKicks.length, awayKicks.length) + 1;
      const newHomeKicks: PenaltyShootoutKick[] = [
        ...homeKicks,
        { order: nextOrder, result: 'pending' }
      ];
      const newAwayKicks: PenaltyShootoutKick[] = [
        ...awayKicks,
        { order: nextOrder, result: 'pending' }
      ];

      const newShootoutData: PenaltyShootoutData = {
        isActive: true,
        homeScore: homePkScore,
        awayScore: awayPkScore,
        homeKicks: newHomeKicks,
        awayKicks: newAwayKicks,
        winner: homePkScore > awayPkScore ? 'home' : awayPkScore > homePkScore ? 'away' : undefined
      };

      await updateMatch(match.id, {
        isPenaltyShootout: true,
        period: '승부차기(서든데스)',
        penaltyShootout: newShootoutData
      });

      if (onNotice) {
        onNotice(`[승부차기] ${nextOrder}번째 서든데스 라운드가 추가되었습니다.`);
      }
    } catch (e) {
      console.error('[PenaltyShootout] Error adding sudden death:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Conclude Shootout & finalize match
  const handleFinalizeShootout = async (winnerTeam: 'home' | 'away') => {
    if (!canEdit || isUpdating) return;
    const winnerName = winnerTeam === 'home' ? match.homeTeam : match.awayTeam;
    if (!window.confirm(`[승부차기 공식 종료]\n승자: ${winnerName}\n점수: 정규 ${match.homeScore}:${match.awayScore} (승부차기 ${homePkScore}:${awayPkScore})\n\n경기를 공식 종료하시겠습니까?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const updatedShootout: PenaltyShootoutData = {
        isActive: false,
        homeScore: homePkScore,
        awayScore: awayPkScore,
        homeKicks,
        awayKicks,
        winner: winnerTeam,
        completedAt: new Date().toISOString()
      };

      await updateMatch(match.id, {
        status: 'FINISHED',
        period: '경기 종료 (승부차기)',
        timerRunning: false,
        isPenaltyShootout: true,
        penaltyShootout: updatedShootout
      });

      if (onNotice) {
        onNotice(`[승부차기 승리 확정] ${winnerName} 승리! (정규 ${match.homeScore}:${match.awayScore} / PK ${homePkScore}:${awayPkScore})`);
      }
    } catch (e) {
      console.error('[PenaltyShootout] Error finalizing match:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Start penalty shootout manually if tied
  const handleStartShootoutManually = async () => {
    if (!canEdit || isUpdating) return;
    setIsUpdating(true);
    try {
      const initialShootout: PenaltyShootoutData = {
        isActive: true,
        homeScore: 0,
        awayScore: 0,
        homeKicks: defaultKicks(5),
        awayKicks: defaultKicks(5)
      };

      await updateMatch(match.id, {
        status: 'LIVE',
        period: '승부차기',
        timerRunning: false,
        isPenaltyShootout: true,
        penaltyShootout: initialShootout
      });

      if (onNotice) {
        onNotice('축구 정규시간 무승부에 따라 승부차기(PK)가 공식 개시되었습니다.');
      }
    } catch (e) {
      console.error('[PenaltyShootout] Error starting shootout:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Diamond shape kicker indicator
  const renderDiamond = (kick: PenaltyShootoutKick, isHome: boolean) => {
    const { order, result } = kick;

    if (result === 'scored') {
      // 카타르 월드컵 스타일: 초록색 다이아몬드 (성공)
      return (
        <div
          key={order}
          className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
          title={`${order}번 키커: 성공 (득점)`}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 shadow-md shadow-emerald-950/60 rotate-45 rounded-xs border border-emerald-300/80 flex items-center justify-center">
            <span className="-rotate-45 text-[10px] sm:text-[11px] font-black font-mono text-white select-none">
              {order}
            </span>
          </div>
        </div>
      );
    }

    if (result === 'missed') {
      // 카타르 월드컵 스타일: 빨간색 다이아몬드 (실축)
      return (
        <div
          key={order}
          className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
          title={`${order}번 키커: 실축`}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 shadow-md shadow-red-950/60 rotate-45 rounded-xs border border-red-400/80 flex items-center justify-center">
            <span className="-rotate-45 text-[10px] sm:text-[11px] font-black font-mono text-white select-none">
              {order}
            </span>
          </div>
        </div>
      );
    }

    // 대기: 흰색/회색 테두리 다이아몬드
    return (
      <div
        key={order}
        className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 opacity-70"
        title={`${order}번 키커: 대기중`}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 dark:bg-black/40 rotate-45 rounded-xs border border-white/60 dark:border-slate-500 flex items-center justify-center">
          <span className="-rotate-45 text-[10px] sm:text-[11px] font-bold font-mono text-white/80 dark:text-slate-300 select-none">
            {order}
          </span>
        </div>
      </div>
    );
  };

  // If match is not soccer and not shootout, do not render
  if (!isSoccer && !shootout) {
    return null;
  }

  return (
    <div className="w-full space-y-4 pt-2">
      {/* Shootout Activation Banner (if tied and not active yet) */}
      {!shootout && isDraw && match.status !== 'SCHEDULED' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border border-amber-500/30 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>정규시간 동점 ({match.homeScore} : {match.awayScore}) — 축구 규정에 따라 승부차기(PK)가 적용됩니다</span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={handleStartShootoutManually}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              ⚽ 승부차기(PK) 공식 시작하기
            </button>
          )}
        </div>
      )}

      {/* World Cup 2022 Style Penalty Shootout Broadcast Graphic Box */}
      {(shootout || (isSoccer && isDraw)) && (
        <div className="overflow-hidden rounded-2xl shadow-xl border border-slate-700/80 bg-slate-950 font-sans">
          {/* 1. Upper Burgundy/Wine Bar (Main Draw Score & Teams) */}
          <div className="bg-[#600b20] bg-gradient-to-r from-[#4d0718] via-[#700f28] to-[#4d0718] border-b border-[#a81c40]/60 px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
              {/* Home Team Name */}
              <div className="flex-1 text-right flex items-center justify-end gap-2 truncate">
                <span className="text-sm sm:text-base font-black tracking-tight drop-shadow-md truncate">
                  {match.homeTeam}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-white/60 shrink-0" />
              </div>

              {/* Central Main Regular Scores & Arabesque Diamond Pattern */}
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-0.5 bg-black/30 rounded-xl border border-white/20 shrink-0">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {match.homeScore}
                </span>
                <span className="text-amber-300/90 text-xs sm:text-sm font-black select-none">
                  ❖
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {match.awayScore}
                </span>
              </div>

              {/* Away Team Name */}
              <div className="flex-1 text-left flex items-center justify-start gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-white/60 shrink-0" />
                <span className="text-sm sm:text-base font-black tracking-tight drop-shadow-md truncate">
                  {match.awayTeam}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Lower Shootout Bar (Black Background with Diamonds & Hexagon Scoreboard) */}
          <div className="bg-[#0c0d12] bg-gradient-to-b from-[#14151e] to-[#0a0a0f] px-3 sm:px-6 py-3.5 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 max-w-2xl mx-auto">
              {/* Left: Home Team Kickers (1, 2, 3, 4, 5 Diamonds) */}
              <div className="flex items-center justify-center sm:justify-end gap-1.5 flex-1 order-2 sm:order-1 w-full sm:w-auto">
                <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                  {homeKicks.map((kick) => renderDiamond(kick, true))}
                </div>
              </div>

              {/* Center: Qatar Hexagon Shootout Badge */}
              <div className="order-1 sm:order-2 shrink-0">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7a0f2c] via-[#941336] to-[#7a0f2c] border border-amber-400/70 shadow-lg shadow-black/80">
                  <span className="text-lg sm:text-xl font-black font-mono text-white drop-shadow-md">
                    {homePkScore}
                  </span>
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[11px] sm:text-xs font-black tracking-widest text-amber-300 uppercase drop-shadow-sm">
                      승부차기
                    </span>
                    <span className="text-[8px] tracking-wider text-amber-200/80 font-mono -mt-0.5">
                      PENALTIES
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-black font-mono text-white drop-shadow-md">
                    {awayPkScore}
                  </span>
                </div>
              </div>

              {/* Right: Away Team Kickers (1, 2, 3, 4, 5 Diamonds) */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-1 order-3 w-full sm:w-auto">
                <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                  {awayKicks.map((kick) => renderDiamond(kick, false))}
                </div>
              </div>
            </div>

            {/* Shootout Winner Banner if decided */}
            {shootout?.winner && (
              <div className="mt-3 pt-3 border-t border-white/10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    승부차기 결과: {shootout.winner === 'home' ? match.homeTeam : match.awayTeam} 승리 ({homePkScore} : {awayPkScore})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Official & Referee Shootout Management Panel */}
      {canEdit && (shootout || (isSoccer && isDraw)) && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                승부차기(PK) 키커별 실시간 판정 패널
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                심판·기록원 전용
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              클릭 즉시 관중/학생 화면에 카타르 월드컵 스타일 다이아몬드로 동기화됩니다.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Team Kickers Controller */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                <span className="truncate">{match.homeTeam} (홈)</span>
                <span className="font-mono text-red-600 dark:text-red-400 font-black">{homePkScore}골 성공</span>
              </div>
              <div className="space-y-1.5">
                {homeKicks.map((kick) => (
                  <div
                    key={kick.order}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-400 w-16">
                      {kick.order}번 키커
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('home', kick.order, 'scored')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          kick.result === 'scored'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>성공</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('home', kick.order, 'missed')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          kick.result === 'missed'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                        }`}
                      >
                        <XIcon className="w-3 h-3" />
                        <span>실축</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('home', kick.order, 'pending')}
                        className={`p-1 rounded-md text-[10px] transition cursor-pointer ${
                          kick.result === 'pending'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="대기로 초기화"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Team Kickers Controller */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                <span className="truncate">{match.awayTeam} (원정)</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{awayPkScore}골 성공</span>
              </div>
              <div className="space-y-1.5">
                {awayKicks.map((kick) => (
                  <div
                    key={kick.order}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-400 w-16">
                      {kick.order}번 키커
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('away', kick.order, 'scored')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          kick.result === 'scored'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>성공</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('away', kick.order, 'missed')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          kick.result === 'missed'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                        }`}
                      >
                        <XIcon className="w-3 h-3" />
                        <span>실축</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetKickResult('away', kick.order, 'pending')}
                        className={`p-1 rounded-md text-[10px] transition cursor-pointer ${
                          kick.result === 'pending'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="대기로 초기화"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Tools: Sudden Death & Match Finalization */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleAddSuddenDeathRound}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>서든데스 키커 추가 (6번 이후)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinalizeShootout('home')}
                disabled={isUpdating || homePkScore === awayPkScore}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                title={homePkScore === awayPkScore ? '승부차기 점수가 동점일 때는 종료할 수 없습니다.' : `${match.homeTeam} 승리 확정`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>{match.homeTeam} 승리로 경기 공식 종료</span>
              </button>
              <button
                type="button"
                onClick={() => handleFinalizeShootout('away')}
                disabled={isUpdating || homePkScore === awayPkScore}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                title={homePkScore === awayPkScore ? '승부차기 점수가 동점일 때는 종료할 수 없습니다.' : `${match.awayTeam} 승리 확정`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>{match.awayTeam} 승리로 경기 공식 종료</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
