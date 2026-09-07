import React, { useState, useEffect } from 'react';
import { Match, SangsanUser, MatchScoreLog, AuditLog } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Flame,
  Award,
  Clock,
  MapPin,
  ChevronRight,
  Shield,
  FileText,
  AlertTriangle,
  Heart,
  ThumbsUp,
  Zap,
} from 'lucide-react';

interface ScoreboardViewProps {
  matches: Match[];
  currentUser: SangsanUser | null;
  onUpdateMatch: (updatedMatch: Match) => void;
  onAddAuditLog: (log: AuditLog) => void;
  onOpenAuditLogs: (matchId: string) => void;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  matches,
  currentUser,
  onUpdateMatch,
  onAddAuditLog,
  onOpenAuditLogs,
}) => {
  const [activeSportFilter, setActiveSportFilter] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match>(matches[0]);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [logToUndo, setLogToUndo] = useState<MatchScoreLog | null>(null);
  const [undoReason, setUndoReason] = useState<string>('오프사이드');
  const [cheerEffect, setCheerEffect] = useState<string | null>(null);

  // Synchronize selected match if matches prop updates
  useEffect(() => {
    const updated = matches.find((m) => m.id === selectedMatch.id);
    if (updated) {
      setSelectedMatch(updated);
    }
  }, [matches, selectedMatch.id]);

  // Game Timer calculation loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (selectedMatch.status === 'live' && selectedMatch.isTimerRunning) {
      interval = setInterval(() => {
        const updated = {
          ...selectedMatch,
          elapsedSeconds: selectedMatch.elapsedSeconds + 1,
        };
        onUpdateMatch(updated);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedMatch, onUpdateMatch]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRefereeAuthorized =
    currentUser?.role === 'admin' || currentUser?.role === 'student_council';

  // Timer controls
  const handleToggleTimer = () => {
    if (!isRefereeAuthorized) return;
    const updated: Match = {
      ...selectedMatch,
      status: 'live',
      isTimerRunning: !selectedMatch.isTimerRunning,
    };
    onUpdateMatch(updated);
  };

  const handleStopMatch = () => {
    if (!isRefereeAuthorized) return;
    if (window.confirm('경기를 종료하시겠습니까? 경기 결과가 확정됩니다.')) {
      const updated: Match = {
        ...selectedMatch,
        status: 'finished',
        isTimerRunning: false,
      };
      onUpdateMatch(updated);
    }
  };

  // Score modifier
  const handleAddScore = (team: 'A' | 'B', delta: number, description: string) => {
    if (!isRefereeAuthorized) return;

    const newLog: MatchScoreLog = {
      id: `score-${Date.now()}`,
      timestamp: formatTimer(selectedMatch.elapsedSeconds),
      team,
      delta,
      description,
      actor: currentUser?.name || '심판부',
      actorRole: currentUser?.role || 'student_council',
    };

    const newScoreA = team === 'A' ? selectedMatch.scoreA + delta : selectedMatch.scoreA;
    const newScoreB = team === 'B' ? selectedMatch.scoreB + delta : selectedMatch.scoreB;

    const updated: Match = {
      ...selectedMatch,
      scoreA: Math.max(0, newScoreA),
      scoreB: Math.max(0, newScoreB),
      scoreLogs: [newLog, ...selectedMatch.scoreLogs],
    };

    onUpdateMatch(updated);
  };

  // Score undo logic with mandatory reason selection
  const handleInitiateUndo = (log: MatchScoreLog) => {
    if (!isRefereeAuthorized) return;
    setLogToUndo(log);
    setShowUndoModal(true);
  };

  const handleConfirmUndo = () => {
    if (!logToUndo) return;

    const team = logToUndo.team;
    const newScoreA = team === 'A' ? selectedMatch.scoreA - logToUndo.delta : selectedMatch.scoreA;
    const newScoreB = team === 'B' ? selectedMatch.scoreB - logToUndo.delta : selectedMatch.scoreB;

    // Filter out or mark cancelled in log
    const updatedLogs = selectedMatch.scoreLogs.filter((l) => l.id !== logToUndo.id);

    const updated: Match = {
      ...selectedMatch,
      scoreA: Math.max(0, newScoreA),
      scoreB: Math.max(0, newScoreB),
      scoreLogs: updatedLogs,
    };

    // Generate immutable audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      matchId: selectedMatch.id,
      timestamp: new Date().toLocaleTimeString(),
      actor: `${currentUser?.studentId || ''} ${currentUser?.name || '심판부'}`,
      action: `점수 취소 (${logToUndo.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB} -${logToUndo.delta}점)`,
      details: `기존 기록: ${logToUndo.description}`,
      reason: undoReason,
    };

    onAddAuditLog(audit);
    onUpdateMatch(updated);
    setShowUndoModal(false);
    setLogToUndo(null);
  };

  // Cheer engine
  const handleCheer = (team: 'A' | 'B') => {
    const updated: Match = {
      ...selectedMatch,
      cheersA: team === 'A' ? selectedMatch.cheersA + 1 : selectedMatch.cheersA,
      cheersB: team === 'B' ? selectedMatch.cheersB + 1 : selectedMatch.cheersB,
    };
    onUpdateMatch(updated);
    setCheerEffect(`cheer-${team}-${Date.now()}`);
    setTimeout(() => setCheerEffect(null), 1000);
  };

  const filteredMatches = activeSportFilter === 'all'
    ? matches
    : matches.filter((m) => m.sport === activeSportFilter);

  return (
    <div className="space-y-6">
      {/* Top Controls & Sport Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: '전체 종목' },
            { id: 'soccer', label: '축구' },
            { id: 'basketball', label: '농구' },
            { id: 'dodgeball', label: '피구' },
            { id: 'relay_male', label: '남학생 계주' },
            { id: 'relay_female', label: '여학생 계주' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSportFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSportFilter === cat.id
                  ? 'bg-red-900 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onOpenAuditLogs(selectedMatch.id)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          점수 변경 감사 로그 (Audit Logs)
        </button>
      </div>

      {/* Main Broadcast Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Select List (Left 1 col) */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            경기 일정 및 실시간 목록
          </h3>
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedMatch.id === match.id
                    ? 'bg-slate-800/90 border-red-800/90 shadow-md ring-1 ring-red-700/50'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-semibold text-red-400 font-serif">
                    {match.title}
                  </span>
                  {match.status === 'live' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE {formatTimer(match.elapsedSeconds)}
                    </span>
                  ) : match.status === 'finished' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                      경기 종료
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      예정
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-bold text-slate-100">{match.teamA}</span>
                  <span className="font-mono text-base font-black text-amber-400">
                    {match.scoreA} : {match.scoreB}
                  </span>
                  <span className="text-sm font-bold text-slate-100">{match.teamB}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {match.scheduledTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {match.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Center Stage (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Live Indicator Ribbon */}
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-red-950 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-red-900">
                  {selectedMatch.round}
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedMatch.location}
                </span>
              </div>

              {/* Timer Bar */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-700 font-mono text-lg sm:text-xl font-black text-amber-400 tracking-wider">
                  {formatTimer(selectedMatch.elapsedSeconds)}
                </div>

                {isRefereeAuthorized && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleToggleTimer}
                      title={selectedMatch.isTimerRunning ? '타이머 일시정지' : '타이머 시작'}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                      {selectedMatch.isTimerRunning ? (
                        <Pause className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={handleStopMatch}
                      title="경기 종료 확정"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Big Scoreboard Duel */}
            <div className="grid grid-cols-5 items-center py-4 text-center">
              {/* Team A */}
              <div className="col-span-2 flex flex-col items-center space-y-2">
                <span className="text-sm sm:text-lg font-bold text-slate-100 font-serif">
                  {selectedMatch.teamA}
                </span>
                <div className="text-4xl sm:text-6xl font-black font-mono text-white tracking-tight drop-shadow-md">
                  {selectedMatch.scoreA}
                </div>
                {/* Cheer A */}
                <button
                  onClick={() => handleCheer('A')}
                  className="flex items-center gap-1.5 text-xs bg-red-950/80 hover:bg-red-900/90 text-red-300 px-3 py-1.5 rounded-full border border-red-800/80 transition transform active:scale-95 shadow"
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  응원 {selectedMatch.cheersA}
                </button>
              </div>

              {/* VS Divider */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-500 font-mono tracking-widest">
                  VS
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {selectedMatch.status === 'live' ? '진행 중' : '대기/종료'}
                </span>
              </div>

              {/* Team B */}
              <div className="col-span-2 flex flex-col items-center space-y-2">
                <span className="text-sm sm:text-lg font-bold text-slate-100 font-serif">
                  {selectedMatch.teamB}
                </span>
                <div className="text-4xl sm:text-6xl font-black font-mono text-white tracking-tight drop-shadow-md">
                  {selectedMatch.scoreB}
                </div>
                {/* Cheer B */}
                <button
                  onClick={() => handleCheer('B')}
                  className="flex items-center gap-1.5 text-xs bg-blue-950/80 hover:bg-blue-900/90 text-blue-300 px-3 py-1.5 rounded-full border border-blue-800/80 transition transform active:scale-95 shadow"
                >
                  <Flame className="w-3.5 h-3.5 text-blue-400" />
                  응원 {selectedMatch.cheersB}
                </button>
              </div>
            </div>

            {/* Referee Score Controls (Admin & Student Council only) */}
            {isRefereeAuthorized && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                    심판부/학생회 점수 입력 콘솔 ({selectedMatch.sport})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    실시간 점수 및 감사 로그 자동 기록
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Team A Controls */}
                  <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-semibold text-red-400">
                      {selectedMatch.teamA} 점수
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.sport === 'soccer' && (
                        <button
                          onClick={() => handleAddScore('A', 1, '골 (득점)')}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded"
                        >
                          +1 골
                        </button>
                      )}
                      {selectedMatch.sport === 'basketball' && (
                        <>
                          <button
                            onClick={() => handleAddScore('A', 2, '2점슛 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                          >
                            +2점
                          </button>
                          <button
                            onClick={() => handleAddScore('A', 3, '3점슛 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded"
                          >
                            +3점
                          </button>
                          <button
                            onClick={() => handleAddScore('A', 1, '자유투 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                          >
                            +1 FT
                          </button>
                        </>
                      )}
                      {selectedMatch.sport === 'dodgeball' && (
                        <button
                          onClick={() => handleAddScore('A', 1, '아웃 판정 (생존자 감소)')}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded"
                        >
                          +1 득점
                        </button>
                      )}
                      {(selectedMatch.sport === 'relay_male' ||
                        selectedMatch.sport === 'relay_female') && (
                        <button
                          onClick={() => handleAddScore('A', 1, '순위 체크포인트')}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded"
                        >
                          순위 기록
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team B Controls */}
                  <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-semibold text-blue-400">
                      {selectedMatch.teamB} 점수
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.sport === 'soccer' && (
                        <button
                          onClick={() => handleAddScore('B', 1, '골 (득점)')}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded"
                        >
                          +1 골
                        </button>
                      )}
                      {selectedMatch.sport === 'basketball' && (
                        <>
                          <button
                            onClick={() => handleAddScore('B', 2, '2점슛 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                          >
                            +2점
                          </button>
                          <button
                            onClick={() => handleAddScore('B', 3, '3점슛 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded"
                          >
                            +3점
                          </button>
                          <button
                            onClick={() => handleAddScore('B', 1, '자유투 성공')}
                            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                          >
                            +1 FT
                          </button>
                        </>
                      )}
                      {selectedMatch.sport === 'dodgeball' && (
                        <button
                          onClick={() => handleAddScore('B', 1, '아웃 판정 (생존자 감소)')}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded"
                        >
                          +1 득점
                        </button>
                      )}
                      {(selectedMatch.sport === 'relay_male' ||
                        selectedMatch.sport === 'relay_female') && (
                        <button
                          onClick={() => handleAddScore('B', 1, '순위 체크포인트')}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded"
                        >
                          순위 기록
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Score Timeline Log & Score Undo Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>실시간 득점 및 판정 타임라인 (Live Log)</span>
              <span className="text-[11px] font-normal text-slate-400">
                {selectedMatch.scoreLogs.length}건 기록됨
              </span>
            </h4>

            {selectedMatch.scoreLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                아직 등록된 득점 로그가 없습니다. 경기가 시작되면 여기에 실시간 기록됩니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedMatch.scoreLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-semibold">
                        {log.timestamp}
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                          log.team === 'A'
                            ? 'bg-red-950 text-red-300 border border-red-900/60'
                            : 'bg-blue-950 text-blue-300 border border-blue-900/60'
                        }`}
                      >
                        {log.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB}
                      </span>
                      <span className="text-slate-200">{log.description}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">by {log.actor}</span>
                      {isRefereeAuthorized && (
                        <button
                          onClick={() => handleInitiateUndo(log)}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition"
                        >
                          취소/수정
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Undo Reason Modal (Mandatory Spec) */}
      {showUndoModal && logToUndo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              득점 취소 및 감사 기록 (Score Cancellation)
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              점수를 취소하면 실시간 스코어가 차감되며, 감사 로그에 취소 사유와 담당자 정보가
              영구 기록됩니다.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">취소 대상 기록:</div>
              <div className="font-semibold text-white">
                {logToUndo.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB} +
                {logToUndo.delta}점 ({logToUndo.description})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                취소 사유 선택 (필수)
              </label>
              <select
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="오프사이드">오프사이드 (Offside)</option>
                <option value="공격자 파울">공격자 파울 (Foul)</option>
                <option value="심판 판정 번복">심판 판정 번복</option>
                <option value="점수 오입력">점수 오입력 수정</option>
                <option value="기타 규정 위반">기타 규정 위반</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUndoModal(false);
                  setLogToUndo(null);
                }}
                className="w-1/2 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleConfirmUndo}
                className="w-1/2 py-2 rounded-lg text-xs font-semibold bg-rose-800 hover:bg-rose-700 text-white shadow"
              >
                취소 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
