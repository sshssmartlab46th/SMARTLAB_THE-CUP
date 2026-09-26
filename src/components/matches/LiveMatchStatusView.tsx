import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile, ClassLineup } from '../../types';
import { 
  updateScoreWithAudit,
  quickAdjustScore,
  sendCheer, 
  listenLineups, 
  listenCheers,
  startMatch,
  pauseMatch,
  resumeMatch,
  finishMatch,
  updateMatch,
  parseMatchStartTime,
  removeMatchEventWithAudit
} from '../../services/firebaseService';
import { MVPVotingModal } from './MVPVotingModal';
import { GoalScorerModal } from './GoalScorerModal';
import { PenaltyShootoutBoard } from './PenaltyShootoutBoard';
import { 
  Flame, 
  Heart, 
  Trophy, 
  Clock, 
  MapPin, 
  Lock, 
  Edit3, 
  AlertCircle,
  Users,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Trash2
} from 'lucide-react';

interface LiveMatchStatusViewProps {
  currentUser: UserProfile;
  match: MatchItem;
  onBack?: () => void;
}

export const LiveMatchStatusView: React.FC<LiveMatchStatusViewProps> = ({
  currentUser,
  match,
  onBack
}) => {
  const [cheerCounts, setCheerCounts] = useState<{ home: number; away: number }>({ home: 0, away: 0 });
  const [lineups, setLineups] = useState<ClassLineup[]>([]);
  const [showMvpModal, setShowMvpModal] = useState(false);
  const [showScoreEditor, setShowScoreEditor] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalModalTeam, setGoalModalTeam] = useState<'home' | 'away'>('home');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Stepper score modification state
  const [newHomeScore, setNewHomeScore] = useState(match.homeScore ?? 0);
  const [newAwayScore, setNewAwayScore] = useState(match.awayScore ?? 0);
  const [editReason, setEditReason] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state whenever match score updates in real-time
  useEffect(() => {
    setNewHomeScore(match.homeScore ?? 0);
    setNewAwayScore(match.awayScore ?? 0);
  }, [match.homeScore, match.awayScore]);

  // Listen to cheers & lineups
  useEffect(() => {
    const unsubCheer = listenCheers(match.id, (c) => {
      setCheerCounts({ home: c.homeCheers ?? 0, away: c.awayCheers ?? 0 });
    });

    const unsubLineup = listenLineups((lList) => {
      const matchLineups = lList.filter((l) => l.matchId === match.id);
      setLineups(matchLineups);
    });

    return () => {
      unsubCheer();
      unsubLineup();
    };
  }, [match.id]);

  // Authorized score editors: Admin, Student Council, Referee/Scorekeeper, Teacher
  const canEditScore = ['admin', 'student_council', 'referee', 'teacher'].includes(currentUser.role);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCheer = async (team: 'home' | 'away') => {
    try {
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch { /* ignore */ }
      }
      await sendCheer(match.id, team, team === 'home' ? '❤️' : '🔥');
    } catch (e) {
      console.error(e);
    }
  };

  // Instant one-click +1 / -1 adjustment directly from scoreboard
  const handleQuickDelta = async (team: 'home' | 'away', delta: number) => {
    if (!canEditScore || isSubmittingScore) return;
    setIsSubmittingScore(true);

    const teamName = team === 'home' ? match.homeTeam : match.awayTeam;
    const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch { /* ignore */ }
    }

    try {
      await quickAdjustScore(
        match,
        team,
        delta,
        {
          id: currentUser.studentId,
          name: currentUser.name,
          role: currentUser.role
        }
      );
      showToast(`${teamName} ${deltaLabel}점 변경 완료! (감사 로그 자동 기록)`);
    } catch (err) {
      console.error('Failed to quick adjust score:', err);
      showToast('스코어 업데이트에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleStartCurrentMatch = async () => {
    if (!canEditScore || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await startMatch(match.id, match.sport);
      showToast(`${match.title} 경기가 공식 시작되었습니다! (LIVE)`);
    } catch (err) {
      console.error(err);
      showToast('경기 시작 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePauseCurrentMatch = async () => {
    if (!canEditScore || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await pauseMatch(match.id);
      showToast(`${match.title} 경기가 일시정지되었습니다.`);
    } catch (err) {
      console.error(err);
      showToast('일시정지 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResumeCurrentMatch = async () => {
    if (!canEditScore || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await resumeMatch(match.id);
      showToast(`${match.title} 경기가 재개되었습니다.`);
    } catch (err) {
      console.error(err);
      showToast('경기 재개 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFinishCurrentMatch = async () => {
    if (!canEditScore || isUpdatingStatus) return;

    // 축구 경기이고 무승부인 경우, 승부차기 승자가 없으면 승부차기로 자동 전환!
    if (match.sport === 'soccer' && (match.homeScore ?? 0) === (match.awayScore ?? 0)) {
      const hasWinner = match.penaltyShootout?.winner || (
        match.penaltyShootout && match.penaltyShootout.homeScore !== match.penaltyShootout.awayScore
      );

      if (!hasWinner) {
        setIsUpdatingStatus(true);
        try {
          await updateMatch(match.id, {
            status: 'LIVE',
            period: '승부차기',
            timerRunning: false,
            isPenaltyShootout: true,
            penaltyShootout: match.penaltyShootout || {
              isActive: true,
              homeScore: 0,
              awayScore: 0,
              homeKicks: [
                { order: 1, result: 'pending' },
                { order: 2, result: 'pending' },
                { order: 3, result: 'pending' },
                { order: 4, result: 'pending' },
                { order: 5, result: 'pending' }
              ],
              awayKicks: [
                { order: 1, result: 'pending' },
                { order: 2, result: 'pending' },
                { order: 3, result: 'pending' },
                { order: 4, result: 'pending' },
                { order: 5, result: 'pending' }
              ]
            }
          });
          showToast('⚽ 정규시간 무승부: 축구 규정에 따라 승부차기(PK)로 자동 돌입합니다!', 'success');
        } catch (err) {
          console.error(err);
          showToast('승부차기 전환 중 오류가 발생했습니다.', 'error');
        } finally {
          setIsUpdatingStatus(false);
        }
        return;
      }
    }

    setIsUpdatingStatus(true);
    try {
      await finishMatch(match.id);
      showToast(`${match.title} 경기가 공식 종료되었습니다.`);
    } catch (err) {
      console.error(err);
      showToast('경기 종료 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Detailed Modal Save
  const handleSaveDetailedScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmittingScore(true);

    const effectiveReason = editReason.trim() || `스코어 조정 (${newHomeScore} : ${newAwayScore})`;

    try {
      await updateScoreWithAudit(
        match,
        newHomeScore,
        newAwayScore,
        effectiveReason,
        {
          id: currentUser.studentId,
          name: currentUser.name,
          role: currentUser.role
        },
        `스코어 변경: ${newHomeScore} : ${newAwayScore}`
      );
      showToast(`스코어가 ${newHomeScore} : ${newAwayScore}(으)로 성공적으로 반영되었습니다.`);
      setShowScoreEditor(false);
      setEditReason('');
    } catch (err) {
      console.error('Detailed score save error:', err);
      showToast('점수 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const presetReasons = [
    '실시간 정규 득점 (+1)',
    '심판 오심 정정',
    '기록원 오기 수정',
    '경기 규칙 위반/페널티 감점',
    '비디오 판독(VAR) 결과 반영'
  ];

  // 5-minute lineup reveal policy check
  const isLineupRevealed = match.status === 'LIVE' || match.status === 'FINISHED' || currentUser.role === 'admin';

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>경기 목록으로 돌아가기</span>
        </button>
      )}

      {/* Toast notification */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-md animate-fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-white/80 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Match Card */}
      <div className="rounded-2xl border-2 border-red-500/80 dark:border-emerald-500 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Match Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {match.title}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                match.status === 'LIVE'
                  ? 'bg-red-600 text-white animate-pulse'
                  : match.status === 'FINISHED'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
              }`}
            >
              {match.status === 'LIVE' ? 'LIVE 진행중' : match.status === 'FINISHED' ? '경기 종료' : '경기 예정'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {match.scheduledTime || match.startTime || '시간 미정'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {match.location || match.court || '대운동장'}
            </span>
          </div>
        </div>

        {/* Scheduled Status Banner */}
        {match.status === 'SCHEDULED' && (() => {
          const epoch = parseMatchStartTime(match.startTime);
          const isDue = epoch && epoch <= Date.now();
          return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {isDue
                    ? `🕒 시작 시각(${match.startTime})이 경과했습니다. 대기 중인 경기를 즉시 시작할 수 있습니다.`
                    : `🕒 경기 시작 예정 시각: ${match.startTime || '시간 미정'}`}
                </span>
              </div>
              {canEditScore && (
                <button
                  type="button"
                  onClick={handleStartCurrentMatch}
                  disabled={isUpdatingStatus}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>공식 경기 시작하기 (LIVE)</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Live & Paused Status Controls for Officials */}
        {canEditScore && (match.status === 'LIVE' || match.status === 'PAUSED') && (
          <div className="flex items-center justify-end gap-2 pt-1 pb-1">
            {match.status === 'LIVE' ? (
              <button
                type="button"
                onClick={handlePauseCurrentMatch}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-100 transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>경기 일시정지</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResumeCurrentMatch}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>경기 재개</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleFinishCurrentMatch}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-200 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>경기 공식 종료</span>
            </button>
          </div>
        )}

        {/* Big Teams & Scoreboard */}
        <div className="grid grid-cols-3 items-center text-center py-4 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl px-2 sm:px-4">
          {/* Home Team */}
          <div className="space-y-3">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {match.homeTeam}
            </div>

            {/* Quick Score Adjustment Buttons for Authorized Users */}
            {canEditScore ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDelta('home', -1)}
                    disabled={isSubmittingScore || (match.homeScore ?? 0) <= 0}
                    className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950 text-slate-700 dark:text-slate-200 hover:text-red-600 font-black text-sm flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer shadow-2xs"
                    title="홈팀 -1점"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDelta('home', 1)}
                    disabled={isSubmittingScore}
                    className="px-3 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="홈팀 +1점 득점"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>1</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGoalModalTeam('home');
                    setShowGoalModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  title="홈팀 골 넣은 선수 지정 및 타임라인 기록"
                >
                  <span>⚽</span>
                  <span>골 선수 기록</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => handleCheer('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>응원 {cheerCounts.home.toLocaleString()}</span>
            </button>
          </div>

          {/* Central Score */}
          <div className="space-y-1">
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {match.round || match.period || '정규 경기'}
            </div>
          </div>

          {/* Away Team */}
          <div className="space-y-3">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {match.awayTeam}
            </div>

            {/* Quick Score Adjustment Buttons for Authorized Users */}
            {canEditScore ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDelta('away', -1)}
                    disabled={isSubmittingScore || (match.awayScore ?? 0) <= 0}
                    className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 font-black text-sm flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer shadow-2xs"
                    title="원정팀 -1점"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDelta('away', 1)}
                    disabled={isSubmittingScore}
                    className="px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="원정팀 +1점 득점"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>1</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGoalModalTeam('away');
                    setShowGoalModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  title="원정팀 골 넣은 선수 지정 및 타임라인 기록"
                >
                  <span>⚽</span>
                  <span>골 선수 기록</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => handleCheer('away')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>응원 {cheerCounts.away.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Qatar 2022 World Cup Broadcast Style Penalty Shootout Board (축구 무승부 시 자동) */}
        {(match.sport === 'soccer' || match.penaltyShootout) && (
          <PenaltyShootoutBoard
            match={match}
            canEdit={canEditScore}
            onNotice={(txt) => showToast(txt, 'success')}
          />
        )}

        {/* Action bar (Score Edit & MVP Vote) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {canEditScore && (
            <button
              type="button"
              onClick={() => {
                setNewHomeScore(match.homeScore ?? 0);
                setNewAwayScore(match.awayScore ?? 0);
                setShowScoreEditor(!showScoreEditor);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 text-amber-900 dark:text-amber-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>정밀 스코어 편집 및 감사로그 작성 (+1/-1 스텝퍼)</span>
            </button>
          )}

          {match.status === 'FINISHED' && (
            <button
              type="button"
              onClick={() => setShowMvpModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition shadow-xs ml-auto cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>{match.mvpWinner ? `MVP: ${match.mvpWinner}` : '실시간 MVP 투표 참여'}</span>
            </button>
          )}
        </div>

        {/* Interactive Score Stepper Editor (NO raw typing required) */}
        {showScoreEditor && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900 pb-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>심판 및 기록원 전용 스코어보드 제어 (감사로그 자동 기록)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                조작자: <strong>{currentUser.name}</strong> ({currentUser.role === 'referee' ? '심판/기록원' : currentUser.role === 'teacher' ? '선생님' : '관리자'})
              </span>
            </div>

            {/* Stepper Controls for Home & Away */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Team Stepper */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {match.homeTeam} (홈)
                  </span>
                  <span className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
                    {newHomeScore}점
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewHomeScore((s) => Math.max(0, s - 1))}
                    disabled={newHomeScore <= 0}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHomeScore((s) => s + 1)}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHomeScore((s) => s + 2)}
                    className="py-2 px-2.5 rounded-lg bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold cursor-pointer"
                    title="+2점"
                  >
                    +2
                  </button>
                </div>
              </div>

              {/* Away Team Stepper */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {match.awayTeam} (원정)
                  </span>
                  <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {newAwayScore}점
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewAwayScore((s) => Math.max(0, s - 1))}
                    disabled={newAwayScore <= 0}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAwayScore((s) => s + 1)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAwayScore((s) => s + 2)}
                    className="py-2 px-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 text-blue-700 dark:text-blue-300 font-bold cursor-pointer"
                    title="+2점"
                  >
                    +2
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                수정 사유 선택 (원클릭 태그)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetReasons.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditReason(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      editReason === preset
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="직접 입력하거나 위 태그를 누르세요 (미입력 시 기본 사유 자동 적용)"
                className="w-full mt-1.5 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScoreEditor(false)}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-300"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleSaveDetailedScore()}
                disabled={isSubmittingScore}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingScore ? '반영 중...' : '점수 확정 및 감사로그 등록'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Match Events Timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-red-500" />
            경기 실시간 타임라인 및 기록
          </h3>

          {canEditScore && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setGoalModalTeam('home');
                  setShowGoalModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <span>⚽</span>
                <span>골(득점) 선수 기록</span>
              </button>
            </div>
          )}
        </div>

        {(!match.events || match.events.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            기록된 경기 이벤트가 없습니다.
            {canEditScore && (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                상단의 [골(득점) 선수 기록] 버튼을 눌러 라인업에서 선수를 선택해 기록할 수 있습니다.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {match.events.map((evt) => {
              const isGoal = evt.type === 'GOAL';
              const teamLabel = evt.team === 'home' ? match.homeTeam : evt.team === 'away' ? match.awayTeam : '공통';

              const handleDeleteEvent = async () => {
                const isConfirmed = window.confirm(
                  `[${evt.minute}분 ${evt.player || ''} 이벤트]를 타임라인에서 삭제하시겠습니까?`
                );
                if (!isConfirmed) return;

                let revertScore = false;
                if (isGoal) {
                  revertScore = window.confirm(
                    `해당 득점 삭제 시 스코어도 1점 차감 환원하시겠습니까?\n[확인] = 스코어 1점 차감 환원\n[취소] = 스코어 유지, 타임라인 기록만 삭제`
                  );
                }

                setDeletingEventId(evt.id);
                try {
                  await removeMatchEventWithAudit(
                    match,
                    evt.id,
                    revertScore,
                    {
                      id: currentUser.studentId,
                      name: currentUser.name,
                      role: currentUser.role
                    }
                  );
                  showToast('타임라인 이벤트가 성공적으로 삭제되었습니다.');
                } catch (err) {
                  console.error('Failed to remove event:', err);
                  showToast('이벤트 삭제에 실패했습니다.', 'error');
                } finally {
                  setDeletingEventId(null);
                }
              };

              return (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                    isGoal
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-red-600 dark:text-red-400 min-w-[32px]">
                      {evt.minute}'
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {isGoal && <span className="text-sm">⚽</span>}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {evt.player || '선수 미지정'}
                        </span>
                        <span className={`text-[11px] px-1.5 py-0.2 rounded-md font-semibold ${
                          evt.team === 'home'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {teamLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {evt.description || evt.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isGoal
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {evt.type}
                    </span>

                    {canEditScore && (
                      <button
                        type="button"
                        onClick={handleDeleteEvent}
                        disabled={deletingEventId === evt.id}
                        className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lineup Section with 5-Minute Reveal Rule */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-red-500" />
            양 팀 출전 선수 명단 및 라인업
          </h3>
          {!isLineupRevealed && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <Lock className="w-3 h-3" /> 경기 시작 5분 전 자동 공개
            </span>
          )}
        </div>

        {!isLineupRevealed ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Lock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              전략 보호를 위해 경기 시작 5분 전까지 라인업이 비공개됩니다.
            </p>
            <p className="text-[11px] text-slate-400">
              반장 및 관리자만 본인 학급 라인업을 사전에 확인하거나 수정할 수 있습니다.
            </p>
          </div>
        ) : lineups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            등록된 출전 라인업 정보가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lineups.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {l.classId}반 라인업 ({l.formation || '기본'})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    제출: {l.submittedBy}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">선발 선수:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {l.starterPlayers?.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                {l.substitutePlayers && l.substitutePlayers.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">후보(벤치):</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {l.substitutePlayers.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MVP Modal */}
      {showMvpModal && (
        <MVPVotingModal
          currentUser={currentUser}
          match={match}
          isOpen={showMvpModal}
          onClose={() => setShowMvpModal(false)}
        />
      )}

      {/* Goal Scorer Modal */}
      {showGoalModal && (
        <GoalScorerModal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          match={match}
          currentUser={currentUser}
          lineups={lineups}
          initialTeam={goalModalTeam}
          onSuccess={(scorer, team) => {
            const tName = team === 'home' ? match.homeTeam : match.awayTeam;
            showToast(`[${tName}] ${scorer} 선수의 득점이 실시간 타임라인에 기록되었습니다!`);
          }}
        />
      )}
    </div>
  );
};
