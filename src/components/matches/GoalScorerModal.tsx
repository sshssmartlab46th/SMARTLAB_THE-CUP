import React, { useState, useEffect, useMemo } from 'react';
import { MatchItem, UserProfile, ClassLineup } from '../../types';
import { recordMatchGoalWithScorer } from '../../services/firebaseService';
import { getSportScoreMeta } from '../../utils/sportScoreUtils';
import { 
  X, 
  Check, 
  Users, 
  Clock, 
  AlertCircle, 
  ShieldCheck
} from 'lucide-react';

interface GoalScorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchItem;
  currentUser: UserProfile;
  lineups: ClassLineup[];
  initialTeam?: 'home' | 'away';
  onSuccess?: (scorerName: string, team: 'home' | 'away') => void;
}

export const GoalScorerModal: React.FC<GoalScorerModalProps> = ({
  isOpen,
  onClose,
  match,
  currentUser,
  lineups,
  initialTeam = 'home',
  onSuccess
}) => {
  const scoreMeta = useMemo(() => getSportScoreMeta(match.sport), [match.sport]);
  const scoringOptions = useMemo(() => scoreMeta.scoringOptions || [], [scoreMeta]);

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>(initialTeam);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [customPlayerName, setCustomPlayerName] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [minute, setMinute] = useState<number>(() => {
    const elapsed = Math.floor((match.elapsedSeconds || 0) / 60);
    return Math.max(1, elapsed + 1);
  });
  const [selectedOptionId, setSelectedOptionId] = useState<string>(() => scoringOptions[0]?.id || '기본');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial team & default option when opened
  useEffect(() => {
    setSelectedTeam(initialTeam);
    setSelectedPlayer('');
    setCustomPlayerName('');
    setIsManualMode(false);
    setErrorMsg(null);
    if (scoringOptions.length > 0) {
      setSelectedOptionId(scoringOptions[0].id);
    }
    const elapsed = Math.floor((match.elapsedSeconds || 0) / 60);
    setMinute(Math.max(1, elapsed + 1));
  }, [initialTeam, isOpen, match.elapsedSeconds, scoringOptions]);

  const currentOption = useMemo(() => {
    return scoringOptions.find((o) => o.id === selectedOptionId) || scoringOptions[0] || {
      id: '기본',
      label: scoreMeta.scoreNoun,
      desc: '기본 득점',
      points: 1,
      type: 'GOAL' as const,
      badge: scoreMeta.scoreNoun
    };
  }, [scoringOptions, selectedOptionId, scoreMeta]);

  const currentPoints = currentOption.points || 1;
  const currentEventType = currentOption.type || 'GOAL';

  // Find lineup for selected team
  const activeLineup = useMemo(() => {
    const targetClass = selectedTeam === 'home' ? match.homeClass : match.awayClass;
    const targetTeamName = selectedTeam === 'home' ? match.homeTeam : match.awayTeam;

    // 1. Direct match by classId and matchId
    let found = lineups.find((l) => l.matchId === match.id && (
      l.classId === targetClass ||
      targetClass.endsWith(l.classId) ||
      l.classId.endsWith(targetClass)
    ));

    // 2. Match by class num in team title (e.g., '1-1반' -> '1', '101')
    if (!found && targetTeamName) {
      const matchExtract = targetTeamName.match(/(\d+)-(\d+)/) || targetTeamName.match(/(\d+)반/);
      if (matchExtract) {
        const clsNum = matchExtract[2] || matchExtract[1];
        found = lineups.find((l) => l.classId === clsNum || l.classId.includes(clsNum));
      }
    }

    // 3. Fallback to order
    if (!found) {
      if (selectedTeam === 'home' && lineups.length > 0) {
        found = lineups[0];
      } else if (selectedTeam === 'away' && lineups.length > 1) {
        found = lineups[1];
      }
    }

    return found;
  }, [selectedTeam, lineups, match]);

  const starters = activeLineup?.starterPlayers || [];
  const substitutes = activeLineup?.substitutePlayers || [];
  const hasLineupPlayers = starters.length > 0 || substitutes.length > 0;

  if (!isOpen) return null;

  const currentTeamName = selectedTeam === 'home' ? match.homeTeam : match.awayTeam;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalPlayerName = isManualMode ? customPlayerName.trim() : (selectedPlayer || customPlayerName).trim();

    if (!finalPlayerName) {
      setErrorMsg(`${scoreMeta.scoreNoun}을(를) 기록할 선수를 라인업에서 선택하거나 직접 입력해주세요.`);
      return;
    }

    if (minute <= 0 || minute > 120) {
      setErrorMsg('정확한 경기 시간(1~120분)을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordMatchGoalWithScorer(
        match,
        selectedTeam,
        finalPlayerName,
        minute,
        currentOption.id,
        {
          id: currentUser.studentId,
          name: currentUser.name,
          role: currentUser.role
        },
        currentPoints,
        currentEventType
      );

      onSuccess?.(finalPlayerName, selectedTeam);
      onClose();
    } catch (err) {
      console.error('Failed to record match goal with scorer:', err);
      setErrorMsg(`${scoreMeta.scoreNoun} 기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-lg font-black shadow-2xs">
              {scoreMeta.sportIcon}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {scoreMeta.sportName} {scoreMeta.scoreNoun} 및 타임라인 기록
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                반장이 사전에 제출한 라인업 명단과 실시간 연동됩니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Team Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              1. {scoreMeta.scoreNoun} 팀 선택
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam('home');
                  setSelectedPlayer('');
                }}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedTeam === 'home'
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">
                  <span>홈팀 (HOME)</span>
                  {selectedTeam === 'home' && <Check className="w-4 h-4" />}
                </div>
                <div className="font-bold text-sm truncate">{match.homeTeam}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  현재 {match.homeScore ?? 0}{scoreMeta.scoreUnit} → 반영 시 {(match.homeScore ?? 0) + currentPoints}{scoreMeta.scoreUnit}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTeam('away');
                  setSelectedPlayer('');
                }}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedTeam === 'away'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                  <span>원정팀 (AWAY)</span>
                  {selectedTeam === 'away' && <Check className="w-4 h-4" />}
                </div>
                <div className="font-bold text-sm truncate">{match.awayTeam}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  현재 {match.awayScore ?? 0}{scoreMeta.scoreUnit} → 반영 시 {(match.awayScore ?? 0) + currentPoints}{scoreMeta.scoreUnit}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Scorer Selection from Lineup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                2. {scoreMeta.scoreNoun} 선수 선택 (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentTeamName}</span>
                )
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(!isManualMode);
                  setSelectedPlayer('');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
              >
                {isManualMode ? '라인업 목록에서 선택하기' : '선수 직접 입력(자책골/외부입력 등)'}
              </button>
            </div>

            {/* Manual input mode */}
            {isManualMode ? (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  선수 성명 또는 학번 직접 입력:
                </label>
                <input
                  type="text"
                  value={customPlayerName}
                  onChange={(e) => setCustomPlayerName(e.target.value)}
                  placeholder={
                    match.sport === 'basketball'
                      ? '예: 20305 손흥민 또는 득점 선수'
                      : match.sport === 'dodgeball'
                      ? '예: 20305 손흥민 또는 아웃 성공 선수'
                      : '예: 20305 손흥민 또는 상대 자책골'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            ) : hasLineupPlayers ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                {activeLineup && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      사전 등록 라인업 ({activeLineup.formation || '선발 명단'})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      제출자: {activeLineup.submittedBy}
                    </span>
                  </div>
                )}

                {/* Starters */}
                {starters.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      선발 출전 선수 ({starters.length}명)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {starters.map((p, idx) => {
                        const isSelected = selectedPlayer === p;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedPlayer(p);
                              setCustomPlayerName('');
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition cursor-pointer flex items-center justify-between truncate ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                            }`}
                          >
                            <span className="truncate">{p}</span>
                            {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Substitutes */}
                {substitutes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      교체 / 벤치 선수 ({substitutes.length}명)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {substitutes.map((p, idx) => {
                        const isSelected = selectedPlayer === p;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedPlayer(p);
                              setCustomPlayerName('');
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition cursor-pointer flex items-center justify-between truncate ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                            }`}
                          >
                            <span className="truncate">{p}</span>
                            {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected feedback pill */}
                {selectedPlayer && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 dark:text-emerald-200">
                      선택된 선수: <strong className="font-bold underline">{selectedPlayer}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer('')}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">{currentTeamName}</span>의 반장이 사전에 등록한 라인업 명단이 없습니다.
                    아래 입력창에 {scoreMeta.scoreNoun} 선수의 이름 또는 학번을 직접 입력해주세요.
                  </div>
                </div>
                <input
                  type="text"
                  value={customPlayerName}
                  onChange={(e) => setCustomPlayerName(e.target.value)}
                  placeholder="예: 20305 손흥민"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* 3. Goal Minute & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Minute */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                3. 기록 시간 (경기 분)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">분</span>
                <button
                  type="button"
                  onClick={() => {
                    const elapsed = Math.floor((match.elapsedSeconds || 0) / 60);
                    setMinute(Math.max(1, elapsed + 1));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition"
                >
                  현재 시각
                </button>
              </div>
            </div>

            {/* Score Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>4. {scoreMeta.scoreNoun} 유형 및 점수</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  +{currentPoints}{scoreMeta.scoreUnit}
                </span>
              </label>
              <select
                value={selectedOptionId}
                onChange={(e) => setSelectedOptionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-emerald-500"
              >
                {scoringOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Details of selected scoring option */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{scoreMeta.sportIcon}</span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{currentOption.label}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentOption.desc}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
              +{currentPoints}{scoreMeta.scoreUnit} 반영
            </span>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedPlayer && !customPlayerName.trim())}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSubmitting
              ? '기록 중...'
              : `${scoreMeta.sportIcon} ${currentOption.label} 기록 (+${currentPoints}${scoreMeta.scoreUnit} 반영)`}
          </button>
        </div>
      </div>
    </div>
  );
};
