import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile, SportType, TimelineEvent } from '../types';
import { updateMatch, updateScoreWithAudit, listenCheers, sendCheer } from '../services/firebaseService';
import { 
  Trophy, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Radio, 
  AlertTriangle, 
  ChevronRight, 
  Activity, 
  Lock, 
  Unlock, 
  Plus, 
  Minus,
  Sparkles,
  Share2
} from 'lucide-react';

interface LiveMatchesViewProps {
  matches: MatchItem[];
  currentUser: UserProfile;
}

export function LiveMatchesView({ matches, currentUser }: LiveMatchesViewProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || 'soccer-final-01');
  const [sportFilter, setSportFilter] = useState<SportType | 'all'>('all');
  const [cheerData, setCheerData] = useState<{ homeCheers: number; awayCheers: number }>({ homeCheers: 128, awayCheers: 104 });
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; team: 'home' | 'away' }[]>([]);

  // Rollback Score Modal State
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackTeam, setRollbackTeam] = useState<'home' | 'away'>('home');
  const [rollbackReason, setRollbackReason] = useState('오심 판정 정정');
  const [customReason, setCustomReason] = useState('');

  // Quick Event Log Input State
  const [eventDescription, setEventDescription] = useState('');

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // Referee / Council / Admin permissions
  const canControlMatch = currentUser.role === 'admin' || currentUser.role === 'student_council';

  // Realtime cheers subscription
  useEffect(() => {
    if (!selectedMatch) return;
    const unsub = listenCheers(selectedMatch.id, (data) => {
      setCheerData({ homeCheers: data.homeCheers, awayCheers: data.awayCheers });
    });
    return () => unsub();
  }, [selectedMatch?.id]);

  // Timer Tick Engine for Live Match
  useEffect(() => {
    if (!selectedMatch || !selectedMatch.timerRunning) return;

    const interval = setInterval(() => {
      // Local tick
      selectedMatch.elapsedSeconds += 1;
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedMatch?.timerRunning, selectedMatch?.id]);

  const formatTimer = (totalSeconds: number = 0) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleTimer = async () => {
    if (!selectedMatch || !canControlMatch) return;
    const newRunning = !selectedMatch.timerRunning;
    const newStatus = newRunning ? 'LIVE' : 'PAUSED';
    await updateMatch(selectedMatch.id, {
      timerRunning: newRunning,
      status: newStatus,
      elapsedSeconds: selectedMatch.elapsedSeconds
    });
  };

  const handleResetTimer = async () => {
    if (!selectedMatch || !canControlMatch) return;
    if (!confirm('경기 타이머를 00:00으로 초기화하시겠습니까?')) return;
    await updateMatch(selectedMatch.id, {
      elapsedSeconds: 0,
      timerRunning: false,
      status: 'SCHEDULED'
    });
  };

  const handleAddScore = async (team: 'home' | 'away', points: number, desc?: string) => {
    if (!selectedMatch || !canControlMatch) return;
    const newHome = team === 'home' ? selectedMatch.homeScore + points : selectedMatch.homeScore;
    const newAway = team === 'away' ? selectedMatch.awayScore + points : selectedMatch.awayScore;

    const actionDesc = desc || (selectedMatch.sport === 'soccer' 
      ? `${team === 'home' ? selectedMatch.homeTeam : selectedMatch.awayTeam} 골 득점!` 
      : `${points}점 득점`);

    await updateScoreWithAudit(
      selectedMatch,
      newHome,
      newAway,
      '정규 득점 인정',
      { id: currentUser.studentId, name: `${currentUser.studentId} ${currentUser.name}`, role: currentUser.role },
      actionDesc
    );
  };

  const handleOpenRollback = (team: 'home' | 'away') => {
    setRollbackTeam(team);
    setShowRollbackModal(true);
  };

  const handleConfirmRollback = async () => {
    if (!selectedMatch) return;
    const effectiveReason = rollbackReason === '기타' ? customReason : rollbackReason;
    if (!effectiveReason.trim()) {
      alert('취소/롤백 사유를 입력해 주세요.');
      return;
    }

    const newHome = rollbackTeam === 'home' ? Math.max(0, selectedMatch.homeScore - 1) : selectedMatch.homeScore;
    const newAway = rollbackTeam === 'away' ? Math.max(0, selectedMatch.awayScore - 1) : selectedMatch.awayScore;

    await updateScoreWithAudit(
      selectedMatch,
      newHome,
      newAway,
      effectiveReason,
      { id: currentUser.studentId, name: `${currentUser.studentId} ${currentUser.name}`, role: currentUser.role },
      `[취소/롤백] 사유: ${effectiveReason}`
    );

    setShowRollbackModal(false);
  };

  const handleSendCheer = async (team: 'home' | 'away', emoji: string) => {
    if (!selectedMatch) return;

    // Trigger floating emoji animation
    const newId = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id: newId, emoji, team }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 1500);

    // Optimistic local state
    setCheerData((prev) => ({
      homeCheers: team === 'home' ? prev.homeCheers + 1 : prev.homeCheers,
      awayCheers: team === 'away' ? prev.awayCheers + 1 : prev.awayCheers
    }));

    await sendCheer(selectedMatch.id, team, emoji);
  };

  // 5-minute pre-match lock logic
  const checkIsLineupLocked = (match: MatchItem) => {
    const startTimeMs = new Date(match.startTime).getTime();
    const nowMs = Date.now();
    const diffMins = (startTimeMs - nowMs) / (1000 * 60);
    // Locked if more than 5 minutes before match start
    return diffMins > 5;
  };

  const filteredMatches = matches.filter((m) => {
    if (sportFilter === 'all') return true;
    return m.sport === sportFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sport Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSportFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'all'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          전체 종목
        </button>
        <button
          onClick={() => setSportFilter('soccer')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'soccer'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          ⚽ 축구 (토너먼트)
        </button>
        <button
          onClick={() => setSportFilter('basketball')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'basketball'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🏀 농구 (남학생)
        </button>
        <button
          onClick={() => setSportFilter('dodgeball')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'dodgeball'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🏐 피구 (여학생)
        </button>
        <button
          onClick={() => setSportFilter('relay_male')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'relay_male'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🏃 남학생 계주 (타임트라이얼)
        </button>
        <button
          onClick={() => setSportFilter('relay_female')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            sportFilter === 'relay_female'
              ? 'bg-red-900 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🏃‍♀️ 여학생 계주 (단판결승)
        </button>
      </div>

      {/* Main Selected Match Live Screen */}
      {selectedMatch ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Top Status & Court Bar */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 ${
                selectedMatch.status === 'LIVE'
                  ? 'bg-red-950 text-red-400 border border-red-800/80'
                  : selectedMatch.status === 'PAUSED'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {selectedMatch.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                {selectedMatch.status}
              </span>
              <span className="text-xs font-semibold text-slate-300">{selectedMatch.round}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{selectedMatch.court}</span>
            </div>

            {/* Lineup 5-minute Lock Badge */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {checkIsLineupLocked(selectedMatch) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px]">
                  <Lock className="w-3 h-3 text-amber-400" />
                  라인업 보안 잠금 (경기 5분 전 자동 공개)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[11px]">
                  <Unlock className="w-3 h-3" />
                  선수 라인업 전체 공개 상태
                </span>
              )}
            </div>
          </div>

          {/* Title Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/60 text-center space-y-1">
            <h2 className="font-serif font-black text-xl sm:text-2xl text-white tracking-wide">
              {selectedMatch.title}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {selectedMatch.period} ({formatTimer(selectedMatch.elapsedSeconds)})
              </span>
              <span>•</span>
              <span>종목: {selectedMatch.sport.toUpperCase()}</span>
            </div>
          </div>

          {/* Scoreboard Arena */}
          <div className="p-6 sm:p-8 relative">
            {/* Floating Emojis Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingEmojis.map((fe) => (
                <div
                  key={fe.id}
                  className={`absolute bottom-10 text-3xl animate-bounce ${
                    fe.team === 'home' ? 'left-1/4' : 'right-1/4'
                  }`}
                >
                  {fe.emoji}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 items-center gap-3">
              {/* Home Team */}
              <div className="col-span-3 text-center sm:text-right pr-2 sm:pr-4 space-y-2">
                <span className="px-2 py-0.5 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-900/60 rounded-md uppercase tracking-wider inline-block">
                  HOME TEAM
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
                  {selectedMatch.homeTeam}
                </h3>
                
                {/* Cheer Reaction Button */}
                <div className="flex items-center justify-center sm:justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => handleSendCheer('home', '🔥')}
                    className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded-lg text-xs text-red-300 font-semibold transition flex items-center gap-1 active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <span>응원 {cheerData.homeCheers}</span>
                  </button>
                  <button
                    onClick={() => handleSendCheer('home', '👏')}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                    title="박수 응원"
                  >
                    👏
                  </button>
                </div>
              </div>

              {/* Score Center Box */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="bg-slate-950 border border-slate-800 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-inner flex items-center justify-center gap-3">
                  <span className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
                    {selectedMatch.homeScore}
                  </span>
                  <span className="text-xl sm:text-3xl font-mono text-slate-600 font-bold">:</span>
                  <span className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
                    {selectedMatch.awayScore}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-mono font-bold">
                  {selectedMatch.sport === 'dodgeball' ? '잔여 생존 인원' : 'OFFICIAL SCORE'}
                </span>
              </div>

              {/* Away Team */}
              <div className="col-span-3 text-center sm:text-left pl-2 sm:pl-4 space-y-2">
                <span className="px-2 py-0.5 text-[11px] font-bold text-blue-400 bg-blue-950/60 border border-blue-900/60 rounded-md uppercase tracking-wider inline-block">
                  AWAY TEAM
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
                  {selectedMatch.awayTeam}
                </h3>

                {/* Cheer Reaction Button */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <button
                    onClick={() => handleSendCheer('away', '🔥')}
                    className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 rounded-lg text-xs text-blue-300 font-semibold transition flex items-center gap-1 active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5 text-blue-400" />
                    <span>응원 {cheerData.awayCheers}</span>
                  </button>
                  <button
                    onClick={() => handleSendCheer('away', '👏')}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                    title="박수 응원"
                  >
                    👏
                  </button>
                </div>
              </div>
            </div>

            {/* Referee / Council Controls Box */}
            {canControlMatch && (
              <div className="mt-8 pt-6 border-t border-slate-800/80 bg-slate-950/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Activity className="w-4 h-4" />
                    <span>공인 심판 &amp; 학생회 실시간 경기 제어 콘솔</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    로그인: {currentUser.studentId} ({currentUser.role})
                  </span>
                </div>

                {/* Timer Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleTimer}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      selectedMatch.timerRunning
                        ? 'bg-amber-900 text-amber-200 hover:bg-amber-800'
                        : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800'
                    }`}
                  >
                    {selectedMatch.timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>경기 시간 일시정지</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>경기 시작 / 재개</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetTimer}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>타이머 리셋</span>
                  </button>
                </div>

                {/* Sport-specific Score Modifier Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Home Score Buttons */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-red-400 block">
                      {selectedMatch.homeTeam} 점수 입력
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedMatch.sport === 'soccer' && (
                        <button
                          onClick={() => handleAddScore('home', 1)}
                          className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          +1 Goal
                        </button>
                      )}
                      {selectedMatch.sport === 'basketball' && (
                        <>
                          <button
                            onClick={() => handleAddScore('home', 2)}
                            className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                          >
                            +2점
                          </button>
                          <button
                            onClick={() => handleAddScore('home', 3)}
                            className="px-2.5 py-1.5 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                          >
                            +3점 슛
                          </button>
                          <button
                            onClick={() => handleAddScore('home', 1)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                          >
                            +1 자유투
                          </button>
                        </>
                      )}
                      {selectedMatch.sport === 'dodgeball' && (
                        <button
                          onClick={() => handleAddScore('home', -1, '외야 아웃 인원 발생')}
                          className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          1명 아웃 (잔여 인원 차감)
                        </button>
                      )}

                      {/* Undo / Rollback button */}
                      <button
                        onClick={() => handleOpenRollback('home')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        오심 취소
                      </button>
                    </div>
                  </div>

                  {/* Away Score Buttons */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-blue-400 block">
                      {selectedMatch.awayTeam} 점수 입력
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedMatch.sport === 'soccer' && (
                        <button
                          onClick={() => handleAddScore('away', 1)}
                          className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          +1 Goal
                        </button>
                      )}
                      {selectedMatch.sport === 'basketball' && (
                        <>
                          <button
                            onClick={() => handleAddScore('away', 2)}
                            className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                          >
                            +2점
                          </button>
                          <button
                            onClick={() => handleAddScore('away', 3)}
                            className="px-2.5 py-1.5 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                          >
                            +3점 슛
                          </button>
                          <button
                            onClick={() => handleAddScore('away', 1)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                          >
                            +1 자유투
                          </button>
                        </>
                      )}
                      {selectedMatch.sport === 'dodgeball' && (
                        <button
                          onClick={() => handleAddScore('away', -1, '외야 아웃 인원 발생')}
                          className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          1명 아웃 (잔여 인원 차감)
                        </button>
                      )}

                      {/* Undo / Rollback button */}
                      <button
                        onClick={() => handleOpenRollback('away')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        오심 취소
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Events List */}
          <div className="p-5 sm:p-6 bg-slate-950/60 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>실시간 경기 주요 이벤트 타임라인 ({selectedMatch.events?.length || 0})</span>
            </h4>

            {selectedMatch.events && selectedMatch.events.length > 0 ? (
              <div className="relative border-l-2 border-slate-800 ml-3 space-y-3 pt-2">
                {selectedMatch.events.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative pl-5">
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-red-600 border-2 border-slate-900" />
                    <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800/40 rounded text-[10px] font-bold font-mono">
                            {evt.minute}&apos;
                          </span>
                          <span className="font-bold text-white text-xs">
                            {evt.type === 'GOAL' && '⚽ GOAL 득점'}
                            {evt.type === 'POINT_2' && '🏀 2점 득점'}
                            {evt.type === 'POINT_3' && '🎯 3점 버저비터'}
                            {evt.type === 'YELLOW_CARD' && '🟨 옐로카드'}
                            {evt.type === 'RED_CARD' && '🟥 레드카드 퇴장'}
                            {evt.type === 'OUT' && '🔴 피구 아웃'}
                            {evt.type === 'NOTICE' && '📢 심판 공지'}
                          </span>
                          {evt.player && (
                            <span className="text-slate-300 font-medium text-xs">
                              {evt.player}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{evt.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString('ko-KR', { hour12: false })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                기록된 경기 주요 상황이 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Match Selector Strip */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>대회 전체 경기 목록 및 일정</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMatches.map((m) => {
            const isSelected = m.id === selectedMatchId;
            const isLocked = checkIsLineupLocked(m);
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-red-600 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'LIVE'
                      ? 'bg-red-950 text-red-400 border border-red-800/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{m.round}</span>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span className="truncate pr-2">{m.homeTeam}</span>
                    <span className="font-mono text-red-400">{m.homeScore}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span className="truncate pr-2">{m.awayTeam}</span>
                    <span className="font-mono text-blue-400">{m.awayScore}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{m.court}</span>
                  {isLocked ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 라인업 락
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> 라인업 공개
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Rollback Modal with Reason Selection */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>오심/득점 취소 사유 입력 (감사 로그 기록)</span>
            </div>

            <p className="text-xs text-slate-300">
              상산고 체육대회 공정 운영 규정에 따라 스코어 롤백은 <b>불변 감사 로그(Audit Log)</b>에 영구 기록됩니다.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">취소 사유 선택</label>
              <select
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-600"
              >
                <option value="오프사이드 반칙 판정">오프사이드 반칙 판정</option>
                <option value="공격자 파울/핸드볼">공격자 파울/핸드볼</option>
                <option value="심판진 비디오판독(VAR) 오심 정정">심판진 비디오판독(VAR) 오심 정정</option>
                <option value="기록원 단순 입력 오타 수정">기록원 단순 입력 오타 수정</option>
                <option value="기타">기타 직접 입력</option>
              </select>

              {rollbackReason === '기타' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="구체적인 사유를 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-600 mt-2"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRollback}
                className="flex-1 py-2.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                감사 로그 기록 및 점수 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
