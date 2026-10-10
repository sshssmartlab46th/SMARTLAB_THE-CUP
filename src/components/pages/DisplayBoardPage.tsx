import React, { useState, useEffect, useMemo } from 'react';
import { MatchItem, ClassStandingItem, CheerCount, CheerMessageItem } from '../../types';
import { listenCheers } from '../../services/firebaseService';
import {
  Trophy,
  Maximize2,
  Minimize2,
  Flame,
  Radio,
  Clock,
  ChevronRight,
  ArrowLeft,
  Activity,
  Award,
  Sparkles,
  Zap,
  MapPin
} from 'lucide-react';

interface DisplayBoardPageProps {
  matches: MatchItem[];
  standings: ClassStandingItem[];
  cheersFeed?: CheerMessageItem[];
  onBack?: () => void;
}

export const DisplayBoardPage: React.FC<DisplayBoardPageProps> = ({
  matches,
  standings,
  cheersFeed = [],
  onBack
}) => {
  // 1. Current Clock State for Stadium Header
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // 3. High-Contrast / Stadium Mode State
  const [highContrast, setHighContrast] = useState<boolean>(true);

  // Default Demo Match for cold-start or empty matches array
  const defaultDemoMatch: MatchItem = useMemo(() => ({
    id: 'demo-board-match',
    sport: 'soccer',
    matchType: 'tournament',
    title: '축구 결승전',
    round: '결승전',
    homeTeam: '3-2 (백호)',
    awayTeam: '3-5 (청룡)',
    homeClass: '302',
    awayClass: '305',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    period: '후반전 18분',
    elapsedSeconds: 1080,
    timerRunning: true,
    startTime: new Date().toISOString(),
    court: '상산고 대운동장 메인 코트',
    location: '상산고 대운동장 메인 코트',
    events: [
      {
        id: 'demo-ev-1',
        minute: 12,
        type: 'GOAL',
        team: 'home',
        player: '김민준',
        description: '오른발 중거리 슛',
        timestamp: new Date().toISOString()
      },
      {
        id: 'demo-ev-2',
        minute: 28,
        type: 'GOAL',
        team: 'away',
        player: '박서준',
        description: '헤더 골',
        timestamp: new Date().toISOString()
      },
      {
        id: 'demo-ev-3',
        minute: 41,
        type: 'GOAL',
        team: 'home',
        player: '이도현',
        description: '페널티킥 득점',
        timestamp: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  }), []);

  const displayMatches = useMemo(() => {
    return matches.length > 0 ? matches : [defaultDemoMatch];
  }, [matches, defaultDemoMatch]);

  // 4. Selected Match for Display Board
  const liveMatch = useMemo(() => {
    return displayMatches.find((m) => m.status === 'LIVE' || m.status === 'PAUSED') ||
      displayMatches.find((m) => m.status === 'SCHEDULED') ||
      displayMatches[0] ||
      defaultDemoMatch;
  }, [displayMatches, defaultDemoMatch]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(liveMatch?.id || '');

  useEffect(() => {
    if (liveMatch && (!selectedMatchId || !displayMatches.some((m) => m.id === selectedMatchId))) {
      setSelectedMatchId(liveMatch.id);
    }
  }, [liveMatch, displayMatches, selectedMatchId]);

  const currentMatch = useMemo(() => {
    return displayMatches.find((m) => m.id === selectedMatchId) || liveMatch;
  }, [displayMatches, selectedMatchId, liveMatch]);

  // 5. Real-time Cheer Data for Current Match
  const [cheerData, setCheerData] = useState<CheerCount>({
    matchId: currentMatch?.id || '',
    homeCheers: 0,
    awayCheers: 0
  });

  useEffect(() => {
    if (!currentMatch?.id) return;
    const unsub = listenCheers(currentMatch.id, (data) => {
      setCheerData(data);
    });
    return () => unsub();
  }, [currentMatch?.id]);

  // Calculate cheer percentages
  const totalCheers = cheerData.homeCheers + cheerData.awayCheers;
  const homePercent = totalCheers > 0 ? Math.round((cheerData.homeCheers / totalCheers) * 100) : 50;
  const awayPercent = totalCheers > 0 ? 100 - homePercent : 50;

  // Format Elapsed Seconds
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Default Demo Standings if standings array is empty
  const defaultDemoStandings: ClassStandingItem[] = useMemo(() => [
    { id: '302', rank: 1, classLabel: '3-2반', points: 520, grade: '3', classNum: '2' },
    { id: '305', rank: 2, classLabel: '3-5반', points: 410, grade: '3', classNum: '5' },
    { id: '201', rank: 3, classLabel: '2-1반', points: 380, grade: '2', classNum: '1' },
    { id: '104', rank: 4, classLabel: '1-4반', points: 310, grade: '1', classNum: '4' },
    { id: '303', rank: 5, classLabel: '3-3반', points: 280, grade: '3', classNum: '3' },
    { id: '208', rank: 6, classLabel: '2-8반', points: 240, grade: '2', classNum: '8' }
  ] as unknown as ClassStandingItem[], []);

  // Top 8 Classes for Display
  const topStandings = useMemo(() => {
    const list = standings.length > 0 ? standings : defaultDemoStandings;
    return list.slice(0, 8);
  }, [standings, defaultDemoStandings]);

  return (
    <div className={`min-h-screen ${highContrast ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-100'} p-3 sm:p-6 flex flex-col justify-between font-sans transition-colors select-none`}>

      {/* ========================================== */}
      {/* 1. STADIUM BOARD HEADER                    */}
      {/* ========================================== */}
      <header className="border-b border-slate-800/80 pb-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="메인 화면으로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">메인 앱</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black tracking-widest uppercase flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-amber-300" />
                STADIUM BOARD
              </span>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                상산고등학교 체육대회 전광판
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{currentMatch?.court || currentMatch?.location || '상산고 대운동장 메인 코트'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono font-bold">실시간 동기화 중</span>
            </p>
          </div>
        </div>

        {/* Header Right Tools: Match Picker & Display Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Match Picker Selector */}
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            {displayMatches.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.status === 'LIVE' ? '🔴 진행중' : m.status === 'FINISHED' ? '완료' : '예정'}] {m.title} ({m.homeTeam} vs {m.awayTeam})
              </option>
            ))}
          </select>

          {/* High Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
              highContrast
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">고대비 모드</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg"
            title="전체화면 전광판 모드"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? '축소' : '전체화면'}</span>
          </button>

          {/* Live Digital Clock */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-black text-sm sm:text-base flex items-center gap-1.5 shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{currentTime || '00:00:00'}</span>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* 2. MAIN BOARD CONTENT GRID                 */}
      {/* ========================================== */}
      {currentMatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">

          {/* LEFT 8 COLUMNS: LARGE SCOREBOARD & CHEER GAUGE */}
          <div className="lg:col-span-8 flex flex-col gap-6 justify-between">

            {/* SCOREBOARD MAIN CONTAINER */}
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md">

              {/* Top Status & Match Info Bar */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 ${
                    currentMatch.status === 'LIVE'
                      ? 'bg-red-600 text-white animate-pulse shadow-lg'
                      : currentMatch.status === 'PAUSED'
                      ? 'bg-amber-600 text-white'
                      : currentMatch.status === 'FINISHED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {currentMatch.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                    {currentMatch.status === 'LIVE' ? 'LIVE SCORE' : currentMatch.status === 'PAUSED' ? '일시정지' : currentMatch.status === 'FINISHED' ? '경기 종료' : '경기 예정'}
                  </span>

                  <span className="text-sm sm:text-base font-bold text-slate-300">
                    {currentMatch.round} · {currentMatch.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-slate-400 bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700">
                    {currentMatch.period || '전반전'}
                  </span>

                  {/* Big Timer */}
                  <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 bg-slate-950 px-4 py-1 rounded-xl border border-amber-500/30 shadow-inner tracking-widest">
                    {formatTimer(currentMatch.elapsedSeconds || 0)}
                  </div>
                </div>
              </div>

              {/* HUGE TEAMS & SCORE MATCHUP */}
              <div className="grid grid-cols-11 items-center gap-2 py-4 sm:py-8">

                {/* HOME TEAM */}
                <div className="col-span-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 border-2 border-red-400/50 flex items-center justify-center text-white text-2xl sm:text-4xl font-black shadow-xl">
                    {currentMatch.homeClass?.slice(-2) || 'H'}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-red-400 tracking-wider">HOME TEAM</span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mt-1">
                      {currentMatch.homeTeam}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
                      {currentMatch.homeClass ? `${currentMatch.homeClass}반` : '홈 팀'}
                    </p>
                  </div>
                </div>

                {/* SCORES DISPLAY */}
                <div className="col-span-3 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono font-black text-6xl sm:text-8xl tracking-tight text-white drop-shadow-2xl">
                    <span className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]">
                      {currentMatch.homeScore}
                    </span>
                    <span className="text-slate-600 text-4xl sm:text-6xl">:</span>
                    <span className="text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                      {currentMatch.awayScore}
                    </span>
                  </div>

                  {currentMatch.isPenaltyShootout && currentMatch.penaltyShootout && (
                    <div className="mt-3 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                      PSO: {currentMatch.penaltyShootout.homeScore} - {currentMatch.penaltyShootout.awayScore}
                    </div>
                  )}
                </div>

                {/* AWAY TEAM */}
                <div className="col-span-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/50 flex items-center justify-center text-white text-2xl sm:text-4xl font-black shadow-xl">
                    {currentMatch.awayClass?.slice(-2) || 'A'}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">AWAY TEAM</span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mt-1">
                      {currentMatch.awayTeam}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
                      {currentMatch.awayClass ? `${currentMatch.awayClass}반` : '원정 팀'}
                    </p>
                  </div>
                </div>

              </div>

              {/* TIMELINE EVENTS / SCORERS SUMMARY */}
              <div className="mt-6 border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-4">
                {/* Home Scorer List */}
                <div className="space-y-1 text-left">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    ⚽ 득점 / 주요 이벤트 ({currentMatch.homeTeam})
                  </span>
                  <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                    {currentMatch.events && currentMatch.events.filter((e) => e.team === 'home').length > 0 ? (
                      currentMatch.events.filter((e) => e.team === 'home').map((ev) => (
                        <div key={ev.id} className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                          <span>• {ev.minute}′</span>
                          <span>{ev.player || '득점자'}</span>
                          <span className="text-slate-400 font-normal">({ev.description})</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">기록된 이벤트 없음</div>
                    )}
                  </div>
                </div>

                {/* Away Scorer List */}
                <div className="space-y-1 text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    ⚽ 득점 / 주요 이벤트 ({currentMatch.awayTeam})
                  </span>
                  <div className="max-h-20 overflow-y-auto space-y-1 pl-1">
                    {currentMatch.events && currentMatch.events.filter((e) => e.team === 'away').length > 0 ? (
                      currentMatch.events.filter((e) => e.team === 'away').map((ev) => (
                        <div key={ev.id} className="text-xs font-bold text-emerald-300 flex items-center justify-end gap-1.5">
                          <span className="text-slate-400 font-normal">({ev.description})</span>
                          <span>{ev.player || '득점자'}</span>
                          <span>• {ev.minute}′</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">기록된 이벤트 없음</div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* REAL-TIME CHEER GAUGE (응원 게이지) */}
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  <h3 className="text-lg font-black text-white tracking-tight">
                    실시간 학급 응원 게이지 (CHEER GAUGE)
                  </h3>
                </div>
                <div className="text-xs font-mono font-bold text-slate-400">
                  총 응원 참여수: <strong className="text-amber-400">{totalCheers.toLocaleString()}</strong>표
                </div>
              </div>

              {/* Dual Percentage Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-red-400 flex items-center gap-1 text-sm sm:text-base">
                    <span>{currentMatch.homeTeam}</span>
                    <strong className="font-mono text-white">({homePercent}%)</strong>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 text-sm sm:text-base">
                    <strong className="font-mono text-white">({awayPercent}%)</strong>
                    <span>{currentMatch.awayTeam}</span>
                  </span>
                </div>

                <div className="h-6 sm:h-8 rounded-2xl bg-slate-950 p-1 border border-slate-800 flex overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${homePercent}%` }}
                    className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-l-xl transition-all duration-700 ease-out flex items-center justify-start px-2 font-mono font-black text-xs text-white shadow-md"
                  >
                    {cheerData.homeCheers > 0 && `${cheerData.homeCheers.toLocaleString()}표`}
                  </div>
                  <div
                    style={{ width: `${awayPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-r-xl transition-all duration-700 ease-out flex items-center justify-end px-2 font-mono font-black text-xs text-white shadow-md"
                  >
                    {cheerData.awayCheers > 0 && `${cheerData.awayCheers.toLocaleString()}표`}
                  </div>
                </div>
              </div>

              {/* Cheer Message Ticker Bar */}
              {cheersFeed.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-hidden text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                    실시간 응원톡
                  </span>
                  <div className="truncate text-slate-300 font-medium animate-pulse">
                    <strong className="text-white">{cheersFeed[0].authorMasked}:</strong> {cheersFeed[0].message}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: CLASS STANDINGS LEADERBOARD (순위) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-black text-white tracking-tight">
                      종합 학급 순위 BOARD
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    TOP 8
                  </span>
                </div>

                {/* Standings Table Rows */}
                <div className="space-y-2.5">
                  {topStandings.length > 0 ? (
                    topStandings.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        className={`p-3 rounded-2xl flex items-center justify-between transition border ${
                          idx === 0
                            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border-amber-500/50 text-amber-200'
                            : idx === 1
                            ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40 text-slate-200'
                            : idx === 2
                            ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/40 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black font-mono text-xs ${
                            idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md' :
                            idx === 1 ? 'bg-slate-300 text-slate-950 shadow-md' :
                            idx === 2 ? 'bg-amber-600 text-white shadow-md' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>

                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{st.classLabel || `${st.grade}-${st.classNum}반`}</span>
                              {idx === 0 && <span className="text-xs">🥇</span>}
                              {idx === 1 && <span className="text-xs">🥈</span>}
                              {idx === 2 && <span className="text-xs">🥉</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {(st as any).wins || 0}승 {(st as any).draws || 0}무 {(st as any).losses || 0}패
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-lg text-amber-400">
                            {st.points || (st as any).totalPoints || 0}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">점</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500">
                      집계된 학급 순위 정보가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Stadium Notice / Footer Credit */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-500 font-semibold tracking-tight">
                  상산고등학교 스마트 체육대회 플랫폼 • made by SMARTLAB
                </p>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 font-medium">
          현재 등록된 경기 정보가 없습니다.
        </div>
      )}

      {/* ========================================== */}
      {/* 3. FOOTER CREDIT                           */}
      {/* ========================================== */}
      <footer className="mt-6 border-t border-slate-800/60 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Sangsan High School Sports Festival Big Screen Scoreboard</span>
        <span>made by SMARTLAB</span>
      </footer>

    </div>
  );
};
