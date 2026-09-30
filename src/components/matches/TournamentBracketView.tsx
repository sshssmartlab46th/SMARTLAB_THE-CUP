import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import {
  Trophy,
  Crown,
  Medal,
  Calendar,
  Clock,
  MapPin,
  Bell,
  BellRing,
  Filter,
  RefreshCw,
  GitMerge,
  LayoutList,
  Sparkles
} from 'lucide-react';
import {
  getMatchTournamentSlot,
  getMatchGrade,
  formatKSTTime,
  seedInitialDataIfEmpty,
  getMatchWinner
} from '../../services/firebaseService';

interface TournamentBracketViewProps {
  matches: MatchItem[];
  sport: SportType;
  onSelectSport: (sport: SportType) => void;
  userReminders: string[];
  onToggleReminder: (match: MatchItem) => void;
  onOpenMatchDetail?: (match: MatchItem) => void;
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  matches,
  sport,
  onSelectSport,
  userReminders,
  onToggleReminder,
  onOpenMatchDetail
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'1' | '2' | '3' | 'all'>('1');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [isSeeding, setIsSeeding] = useState(false);

  const sportsList: { key: SportType; label: string; genderNote: string }[] = [
    { key: 'soccer', label: '축구', genderNote: '남자 8강' },
    { key: 'basketball', label: '농구', genderNote: '남자 8강' },
    { key: 'dodgeball', label: '피구', genderNote: '여자 4강' },
    { key: 'relay_male', label: '남자 계주', genderNote: '8개 반 릴레이' },
    { key: 'relay_female', label: '여자 계주', genderNote: '4개 반 릴레이' },
    { key: 'tug_of_war', label: '줄다리기', genderNote: '토너먼트' }
  ];

  // Filter matches by sport and grade using robust getMatchGrade
  const sportMatches = matches.filter((m) => {
    if (m.sport !== sport) return false;
    if (selectedGrade !== 'all') {
      const matchGrade = getMatchGrade(m);
      if (matchGrade !== selectedGrade) return false;
    }
    return true;
  });

  const isRelayOrTrack = sport === 'relay_male' || sport === 'relay_female';
  const isDodgeball = sport === 'dodgeball'; // 4-team tournament

  // Find match by slot or fallback
  const findMatchBySlot = (slot: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'FINAL' | 'BRONZE') => {
    return sportMatches.find(m => getMatchTournamentSlot(m) === slot);
  };

  const qfMatches = sportMatches.filter(m => m.round?.includes('8강') || m.title?.includes('8강'));
  const sfMatches = sportMatches.filter(m => (m.round?.includes('4강') || m.round?.includes('준결승') || m.title?.includes('4강') || m.title?.includes('준결승')) && !m.round?.includes('결승'));
  const finalMatches = sportMatches.filter(m => (m.round?.includes('결승') || m.title?.includes('결승')) && !m.round?.includes('3') && !m.title?.includes('3'));
  const bronzeMatches = sportMatches.filter(m => m.round?.includes('3') || m.title?.includes('3'));

  const mFinal = findMatchBySlot('FINAL') || finalMatches[0];
  const championWinner = mFinal && mFinal.status === 'FINISHED' ? getMatchWinner(mFinal) : null;
  const championTeam = championWinner?.name || null;

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedInitialDataIfEmpty();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const renderBracketMatchCard = (m: MatchItem | undefined, placeholderTitle: string) => {
    if (!m) {
      return (
        <div className="w-56 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-xs text-slate-400 dark:text-slate-600 flex flex-col justify-center items-center h-28 select-none">
          <span className="font-semibold">{placeholderTitle}</span>
          <span className="text-[10px] mt-1 text-slate-400">대진 미정 (이전 라운드 승자 대기)</span>
        </div>
      );
    }

    const hasReminder = userReminders.includes(m.id);
    const winnerObj = m.status === 'FINISHED' ? getMatchWinner(m) : null;
    const isTopWinner = Boolean(winnerObj && winnerObj.name === m.homeTeam);
    const isBottomWinner = Boolean(winnerObj && winnerObj.name === m.awayTeam);

    return (
      <div 
        onClick={() => onOpenMatchDetail?.(m)}
        className="w-56 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs hover:border-red-500 hover:shadow-md transition cursor-pointer relative group select-none"
      >
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
            {m.round || m.title}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              m.status === 'LIVE' 
                ? 'bg-red-600 text-white animate-pulse' 
                : m.status === 'FINISHED'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
            }`}>
              {m.status === 'LIVE' ? 'LIVE' : m.status === 'FINISHED' ? '종료' : '예정'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleReminder(m);
              }}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                hasReminder ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
              }`}
            >
              {hasReminder ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Team 1 (Top) */}
        <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs transition ${
          isTopWinner ? 'bg-red-50 dark:bg-emerald-950/40 font-bold text-red-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            {isTopWinner && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
            <span className="truncate">{m.homeTeam}</span>
          </div>
          <span className="font-mono font-bold text-sm ml-2">
            {m.status === 'FINISHED' || m.status === 'LIVE' ? m.homeScore : '-'}
          </span>
        </div>

        {/* Team 2 (Bottom) */}
        <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs transition mt-0.5 ${
          isBottomWinner ? 'bg-red-50 dark:bg-emerald-950/40 font-bold text-red-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            {isBottomWinner && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
            <span className="truncate">{m.awayTeam}</span>
          </div>
          <span className="font-mono font-bold text-sm ml-2">
            {m.status === 'FINISHED' || m.status === 'LIVE' ? m.awayScore : '-'}
          </span>
        </div>

        {/* Penalty Shootout Mini Score Badge */}
        {((m.penaltyShootout && (m.homeScore === m.awayScore || m.isPenaltyShootout)) || m.period?.includes('승부차기')) && (
          <div className="mt-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-white flex items-center justify-between text-[10px] font-bold">
            <span className="text-amber-300 flex items-center gap-1">
              <span>⚽</span>
              <span>승부차기</span>
            </span>
            <span className="font-mono text-emerald-400">
              {m.penaltyShootout?.homeScore ?? 0} : {m.penaltyShootout?.awayScore ?? 0}
            </span>
          </div>
        )}

        <div className="pt-1.5 mt-1 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>{m.court || '대운동장'}</span>
          <span>{m.startTime ? formatKSTTime(m.startTime) : ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Grade & View Mode */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              학년:
            </span>
            {[
              { key: '1', label: '1학년' },
              { key: '2', label: '2학년' },
              { key: '3', label: '3학년' },
              { key: 'all', label: '전체' }
            ].map(g => (
              <button
                key={g.key}
                type="button"
                onClick={() => setSelectedGrade(g.key as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedGrade === g.key
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Tree vs List */}
          {!isRelayOrTrack && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>토너먼트 트리</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>경기 목록</span>
              </button>
            </div>
          )}
        </div>

        {/* Sport Bar (All sports included) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {sportsList.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectSport(s.key)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                sport === s.key
                  ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                sport === s.key ? 'bg-red-700 dark:bg-emerald-600 text-red-100 dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {s.genderNote}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      {isRelayOrTrack ? (
        /* Relay / Time-Trial Format */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {sportsList.find((s) => s.key === sport)?.label} 일정 및 레인 기록
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedGrade === 'all' ? '전체 학년' : `${selectedGrade}학년`} 트랙 및 필드 종목
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              트랙·기록 종목
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sportMatches.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-slate-400 space-y-3">
                <p>선택한 종목({sportsList.find((s) => s.key === sport)?.label})의 등록된 일정이 없습니다.</p>
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isSeeding}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>상산고 공식 표준 일정 자동 생성</span>
                </button>
              </div>
            ) : (
              sportMatches.map((m) => {
                const hasReminder = userReminders.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 cursor-pointer hover:border-red-400 transition"
                    onClick={() => onOpenMatchDetail?.(m)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'LIVE'
                              ? 'bg-red-600 text-white animate-pulse'
                              : m.status === 'FINISHED'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '예정'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReminder(m);
                        }}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          hasReminder
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="경기 10분 전 알림 신청"
                      >
                        {hasReminder ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {m.startTime ? formatKSTTime(m.startTime) : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {m.court || '육상 트랙'}
                      </span>
                    </div>

                    {/* Team lanes / scores */}
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{m.homeTeam}</div>
                        <div className="text-[10px] text-slate-400">1조 / 1레인</div>
                      </div>
                      <div className="text-base font-black font-mono text-red-600 dark:text-red-400">
                        {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} : ${m.awayScore}` : 'VS'}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">{m.awayTeam}</div>
                        <div className="text-[10px] text-slate-400">2조 / 2레인</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : viewMode === 'tree' ? (
        /* Real Tournament Tree Diagram */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {sportsList.find((s) => s.key === sport)?.label} 공식 토너먼트 대진 트리 ({selectedGrade === 'all' ? '전학년' : `${selectedGrade}학년`})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isDodgeball ? '여자 4개 반 (5, 6, 7, 8반) 준결승 → 결승전 및 3·4위전' : '남자 8강전 → 4강 준결승 → 결승전 및 최종 우승팀 대진도'}
              </p>
            </div>
            {championTeam && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold animate-in fade-in">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>우승: {championTeam}</span>
              </div>
            )}
          </div>

          {sportMatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-3">
              <p>{selectedGrade}학년 {sportsList.find((s) => s.key === sport)?.label} 등록된 경기 대진표가 없습니다.</p>
              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>상산고 공식 표준 대진표 자동 등록</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-6 pt-2">
              <div className="min-w-[650px] flex items-stretch justify-start gap-8 relative px-4">
                {/* Column 1: 8강전 (Only if NOT 4-team Dodgeball) */}
                {!isDodgeball && (
                  <div className="flex flex-col justify-around gap-6">
                    <div className="text-center font-bold text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                      8강전 (준준결승)
                    </div>
                    <div className="space-y-6">
                      {renderBracketMatchCard(findMatchBySlot('QF1') || qfMatches[0], '8강 1경기')}
                      {renderBracketMatchCard(findMatchBySlot('QF2') || qfMatches[1], '8강 2경기')}
                    </div>
                    <div className="space-y-6 mt-4">
                      {renderBracketMatchCard(findMatchBySlot('QF3') || qfMatches[2], '8강 3경기')}
                      {renderBracketMatchCard(findMatchBySlot('QF4') || qfMatches[3], '8강 4경기')}
                    </div>
                  </div>
                )}

                {/* Column 2: 4강전 (Semifinals) */}
                <div className="flex flex-col justify-around gap-6">
                  <div className="text-center font-bold text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                    4강전 (준결승)
                  </div>
                  <div className="flex flex-col justify-around h-full py-8 space-y-12">
                    {renderBracketMatchCard(
                      findMatchBySlot('SF1') || sfMatches[0] || (sportMatches.length > (isDodgeball ? 0 : 4) ? sportMatches[isDodgeball ? 0 : 4] : undefined),
                      '4강 1경기 (준결승 A)'
                    )}
                    {renderBracketMatchCard(
                      findMatchBySlot('SF2') || sfMatches[1] || (sportMatches.length > (isDodgeball ? 1 : 5) ? sportMatches[isDodgeball ? 1 : 5] : undefined),
                      '4강 2경기 (준결승 B)'
                    )}
                  </div>
                </div>

                {/* Column 3: 결승전 (Final) - 3·4위전 미진행 정책 */}
                <div className="flex flex-col justify-around gap-6">
                  <div className="text-center font-bold text-xs text-red-600 dark:text-red-400 pb-2 border-b border-red-200 dark:border-red-900/60 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>결승전</span>
                  </div>
                  <div className="flex flex-col justify-center h-full py-8 space-y-8">
                    {/* Final Match Card */}
                    <div className="relative">
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> 결승전 (우승 결정전)
                      </div>
                      {renderBracketMatchCard(
                        findMatchBySlot('FINAL') || finalMatches[0] || (sportMatches.length > (isDodgeball ? 3 : 6) ? sportMatches[isDodgeball ? 3 : 6] : undefined),
                        '결승전 (우승 결정전)'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tournament List Layout */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {sportsList.find((s) => s.key === sport)?.label} 경기 목록 ({selectedGrade === 'all' ? '전학년' : `${selectedGrade}학년`})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                동일 성별·동일 학년 매칭 (남자: 1~4, 9~12반 / 여자: 5~8반)
              </p>
            </div>
            <div className="text-xs text-slate-400">
              총 {sportMatches.length}경기
            </div>
          </div>

          {sportMatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-3">
              <p>해당 조건에 등록된 경기 대진표가 없습니다.</p>
              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>상산고 공식 표준 대진표 자동 등록</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sportMatches.map((m) => {
                const hasReminder = userReminders.includes(m.id);
                const isHomeWinner = m.status === 'FINISHED' && m.homeScore > m.awayScore;
                const isAwayWinner = m.status === 'FINISHED' && m.awayScore > m.homeScore;

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-red-500/40 transition space-y-3 cursor-pointer"
                    onClick={() => onOpenMatchDetail?.(m)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'LIVE'
                              ? 'bg-red-600 text-white animate-pulse'
                              : m.status === 'FINISHED'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '예정'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleReminder(m);
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            hasReminder
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title="경기 10분 전 알림 신청"
                        >
                          {hasReminder ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {m.startTime ? formatKSTTime(m.startTime) : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {m.court || '경기장'}
                      </span>
                    </div>

                    {/* Matchup row */}
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className={`flex items-center justify-between font-medium ${isHomeWinner ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        <div className="flex items-center gap-1.5">
                          {isHomeWinner && <Crown className="w-3 h-3 text-amber-500" />}
                          <span>{m.homeTeam}</span>
                        </div>
                        <span className="font-mono font-bold text-sm">
                          {m.status === 'FINISHED' || m.status === 'LIVE' ? m.homeScore : '-'}
                        </span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className={`flex items-center justify-between font-medium ${isAwayWinner ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        <div className="flex items-center gap-1.5">
                          {isAwayWinner && <Crown className="w-3 h-3 text-amber-500" />}
                          <span>{m.awayTeam}</span>
                        </div>
                        <span className="font-mono font-bold text-sm">
                          {m.status === 'FINISHED' || m.status === 'LIVE' ? m.awayScore : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
