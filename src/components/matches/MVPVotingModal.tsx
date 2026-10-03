import React, { useState, useEffect } from 'react';
import { UserProfile, MatchItem, MVPVote } from '../../types';
import { listenMVPVotes } from '../../services/firebaseService';
import { validateAndSubmitMVPVote, getMvpVotingTimeLeftSeconds } from '../../services/mvpService';
import { Trophy, Clock, Check, Award, X, AlertCircle } from 'lucide-react';

interface MVPVotingModalProps {
  currentUser: UserProfile;
  match: MatchItem;
  isOpen: boolean;
  onClose: () => void;
}

export const MVPVotingModal: React.FC<MVPVotingModalProps> = ({
  currentUser,
  match,
  isOpen,
  onClose
}) => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<MVPVote[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(() => getMvpVotingTimeLeftSeconds(match));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Setup candidate list from match events/players or default team representation
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);

    // Collect players mentioned in events or candidate pool
    const playerSet = new Set<string>();
    if (match.mvpCandidateIds && match.mvpCandidateIds.length > 0) {
      match.mvpCandidateIds.forEach((p) => playerSet.add(p));
    } else {
      // Default to scorers/event players or general team keys
      match.events?.forEach((evt) => {
        if (evt.player) playerSet.add(evt.player);
      });
      if (playerSet.size === 0) {
        playerSet.add(`${match.homeTeam} 주장`);
        playerSet.add(`${match.awayTeam} 주장`);
      }
    }
    setCandidates(Array.from(playerSet));

    // Listen to votes
    const unsub = listenMVPVotes(match.id, (vList) => {
      setVotes(vList);
      const userVote = vList.find((v) => v.voterStudentId === currentUser.studentId);
      if (userVote) {
        setHasVoted(true);
        setSelectedCandidate(userVote.candidateName);
      }
    });

    // Sync remaining time strictly from server match finish timestamp / deadline
    const updateTimeLeft = () => {
      const remaining = getMvpVotingTimeLeftSeconds(match);
      setTimeLeftSeconds(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isOpen, match, currentUser]);

  if (!isOpen) return null;

  const handleVote = async () => {
    if (!selectedCandidate || hasVoted || timeLeftSeconds <= 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await validateAndSubmitMVPVote(
        match,
        {
          id: `mvp_${match.id}_${currentUser.studentId}`,
          matchId: match.id,
          voterStudentId: currentUser.studentId,
          candidateName: selectedCandidate,
          createdAt: new Date().toISOString()
        },
        currentUser
      );
      setHasVoted(true);
    } catch (e: any) {
      console.error('[MVP Vote Error]', e);
      setErrorMessage(e?.message || '투표 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine winner if time is up
  const isVotingClosed = timeLeftSeconds <= 0 || Boolean(match.mvpWinner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              실시간 MVP 투표
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match info & Countdown */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              {match.title}
            </div>
            <div className="text-slate-500">
              {match.homeTeam} ({match.homeScore}) vs {match.awayTeam} ({match.awayScore})
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>{isVotingClosed ? '투표 마감' : `${timeLeftSeconds}초 남음`}</span>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Privacy rule notice from Planning Doc */}
        <p className="text-[11px] text-slate-500 leading-relaxed">
          * 기획서 규정: 득표율 및 득표수는 비공개 처리되며, 투표 종료 후 최다 득표자(MVP) 결과만 공식 발표됩니다. (1인 1표, 학번 및 1분 타임아웃 서버 검증)
        </p>

        {/* Candidate selection or Winner announcement */}
        {isVotingClosed ? (
          <div className="p-5 text-center bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2">
            <Award className="w-10 h-10 text-amber-500 mx-auto" />
            <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">경기 최우수 선수 (MVP) 선정 결과</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {match.mvpWinner || (votes.length > 0 ? votes[0].candidateName : '선정 심사 완료')}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {candidates.map((cand) => (
              <button
                key={cand}
                type="button"
                disabled={hasVoted}
                onClick={() => setSelectedCandidate(cand)}
                className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                  selectedCandidate === cand
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{cand}</span>
                {selectedCandidate === cand && (
                  <Check className="w-4 h-4 text-amber-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isVotingClosed && (
          <button
            type="button"
            disabled={!selectedCandidate || hasVoted || isSubmitting}
            onClick={handleVote}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            {hasVoted ? '투표 완료 (결과 집계 중)' : isSubmitting ? '투표 전송 중...' : '선택한 선수에게 MVP 투표하기'}
          </button>
        )}
      </div>
    </div>
  );
};
