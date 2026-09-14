import React, { useState, useEffect } from 'react';
import { MatchItem, UserProfile, ClassLineup, CheerCount } from '../../types';
import { 
  updateScoreWithAudit,
  sendCheer, 
  listenLineups, 
  listenCheers 
} from '../../services/firebaseService';
import { MVPVotingModal } from './MVPVotingModal';
import { SoccerFormationBuilder } from '../lineup/SoccerFormationBuilder';
import { 
  Flame, 
  Heart, 
  Trophy, 
  Clock, 
  MapPin, 
  Shield, 
  Award, 
  Lock, 
  Edit3, 
  Check, 
  AlertCircle,
  Users
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

  // Score modification fields (Audit log enforced)
  const [newHomeScore, setNewHomeScore] = useState(match.homeScore);
  const [newAwayScore, setNewAwayScore] = useState(match.awayScore);
  const [editReason, setEditReason] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Listen to cheers & lineups
  useEffect(() => {
    const unsubCheer = listenCheers(match.id, (c) => {
      setCheerCounts({ home: c.homeCheers, away: c.awayCheers });
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

  const canEditScore = ['admin', 'student_council', 'teacher'].includes(currentUser.role);

  const handleCheer = async (team: 'home' | 'away') => {
    try {
      await sendCheer(match.id, team, team === 'home' ? '❤️' : '🔥');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReason.trim()) {
      alert('기획서 규정에 따라 스코어 수정 사유를 반드시 입력해야 합니다.');
      return;
    }

    setIsSubmittingScore(true);
    try {
      await updateScoreWithAudit(
        match,
        newHomeScore,
        newAwayScore,
        editReason.trim(),
        {
          id: currentUser.studentId,
          name: currentUser.name,
          role: currentUser.role
        }
      );
      setShowScoreEditor(false);
      setEditReason('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // 5-minute lineup reveal policy check
  // For demo/real-time: if match is LIVE or FINISHED, lineups are revealed. If SCHEDULED, check 5-minute pre-match.
  const isLineupRevealed = match.status === 'LIVE' || match.status === 'FINISHED' || currentUser.role === 'admin';

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
        >
          ← 경기 목록으로 돌아가기
        </button>
      )}

      {/* Main Scoreboard Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        {/* Header Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {match.sport}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
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
              {match.scheduledTime}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {match.location}
            </span>
          </div>
        </div>

        {/* Big Teams & Scoreboard */}
        <div className="grid grid-cols-3 items-center text-center py-4 border-y border-slate-100 dark:border-slate-800">
          {/* Home Team */}
          <div className="space-y-3">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {match.homeTeam}
            </div>
            <button
              type="button"
              onClick={() => handleCheer('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/50 hover:bg-red-100 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>응원 {cheerCounts.home}</span>
            </button>
          </div>

          {/* Central Score */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {match.homeScore} : {match.awayScore}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {match.round || '정규 경기'}
            </div>
          </div>

          {/* Away Team */}
          <div className="space-y-3">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {match.awayTeam}
            </div>
            <button
              type="button"
              onClick={() => handleCheer('away')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>응원 {cheerCounts.away}</span>
            </button>
          </div>
        </div>

        {/* Action bar (Score Edit & MVP Vote) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {canEditScore && (
            <button
              type="button"
              onClick={() => setShowScoreEditor(!showScoreEditor)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>스코어 수정 (감사로그 기록)</span>
            </button>
          )}

          {match.status === 'FINISHED' && (
            <button
              type="button"
              onClick={() => setShowMvpModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition shadow-xs ml-auto"
            >
              <Trophy className="w-4 h-4" />
              <span>{match.mvpWinner ? `MVP: ${match.mvpWinner}` : '실시간 MVP 투표 참여'}</span>
            </button>
          )}
        </div>

        {/* Score Editor with Mandatory Reason Input (Section 8 Audit Log) */}
        {showScoreEditor && (
          <form
            onSubmit={handleSaveScore}
            className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-3 text-xs"
          >
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>스코어 수정 및 감사 로그(Audit Log) 등록</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              점수 수정 시 수정자(학번 및 이름), 수정 전후 점수, 수정 사유가 감사 로그 컬렉션에 영구 보관됩니다.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">{match.homeTeam} 점수</label>
                <input
                  type="number"
                  min={0}
                  value={newHomeScore}
                  onChange={(e) => setNewHomeScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{match.awayTeam} 점수</label>
                <input
                  type="number"
                  min={0}
                  value={newAwayScore}
                  onChange={(e) => setNewAwayScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">수정 사유 (필수 작성)</label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="예: 심판 오심 정정 / 집계 기록원 오기 수정"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowScoreEditor(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmittingScore || !editReason.trim()}
                className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold"
              >
                {isSubmittingScore ? '저장 중...' : '감사 로그와 함께 점수 확정'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Match Events Timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-red-500" />
          경기 실시간 타임라인 및 기록
        </h3>

        {(!match.events || match.events.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400">
            기록된 경기 이벤트가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {match.events.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">
                    {evt.minute}'
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {evt.player} ({evt.team})
                  </span>
                  <span className="text-slate-500">{evt.detail}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {evt.type}
                </span>
              </div>
            ))}
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
    </div>
  );
};
