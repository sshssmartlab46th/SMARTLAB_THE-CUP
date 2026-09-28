import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import { Trophy, ChevronRight, Crown, Clock, MapPin } from 'lucide-react';
import { getMatchTournamentSlot, getMatchGrade, formatKSTTime } from '../../services/firebaseService';

export interface TournamentMatchNode {
  stage: 'semifinal_1' | 'semifinal_2' | 'final' | string;
  roundName: string;
  teamA: { name: string; score: number | string };
  teamB: { name: string; score: number | string };
  venue?: string;
  statusText?: string;
  isLive?: boolean;
}

export interface TournamentSummaryCardProps {
  title?: string;
  subtitle?: string;
  selectedSport?: SportType;
  availableSports?: { type: SportType; label: string; genderNote: string }[];
  onSelectSport?: (sport: SportType) => void;
  onOpenFullBracket?: () => void;
  matches?: (MatchItem | TournamentMatchNode)[];
}

const DEFAULT_SPORTS: { type: SportType; label: string; genderNote: string }[] = [
  { type: 'soccer', label: '축구', genderNote: '남 8강' },
  { type: 'basketball', label: '농구', genderNote: '남 8강' },
  { type: 'dodgeball', label: '피구', genderNote: '여 4강' },
  { type: 'relay_male', label: '남자 계주', genderNote: '8개 반' },
  { type: 'relay_female', label: '여자 계주', genderNote: '4개 반' },
  { type: 'tug_of_war', label: '줄다리기', genderNote: '토너먼트' },
  { type: 'group_rope', label: '단체 줄넘기', genderNote: '기록' }
];

export const TournamentSummaryCard: React.FC<TournamentSummaryCardProps> = ({
  title = '대진표 요약',
  subtitle = '상산고 공식 체육대회 토너먼트 매치업',
  selectedSport: controlledSport,
  availableSports = DEFAULT_SPORTS,
  onSelectSport,
  onOpenFullBracket,
  matches = []
}) => {
  const [internalSport, setInternalSport] = useState<SportType>('soccer');
  const [selectedGrade, setSelectedGrade] = useState<'1' | '2' | '3'>('1');

  const activeSport = controlledSport || internalSport;

  const handleSportChange = (s: SportType) => {
    setInternalSport(s);
    onSelectSport?.(s);
  };

  // Discriminate whether matches are MatchItem[] or TournamentMatchNode[]
  const isMatchItemList = matches.length > 0 && 'sport' in matches[0];

  const filteredMatches: MatchItem[] = isMatchItemList
    ? (matches as MatchItem[]).filter((m) => {
        if (m.sport !== activeSport) return false;
        const g = getMatchGrade(m);
        return g === selectedGrade;
      })
    : [];

  const isRelay = activeSport === 'relay_male' || activeSport === 'relay_female' || activeSport === 'group_rope';

  // Extract SF1, SF2, FINAL for tournament view
  const sf1 = filteredMatches.find(m => getMatchTournamentSlot(m) === 'SF1' || m.round?.includes('4강 1') || m.title?.includes('4강 1'));
  const sf2 = filteredMatches.find(m => getMatchTournamentSlot(m) === 'SF2' || m.round?.includes('4강 2') || m.title?.includes('4강 2'));
  const finalMatch = filteredMatches.find(m => getMatchTournamentSlot(m) === 'FINAL' || (m.round?.includes('결승') && !m.round?.includes('3')));

  // Champion
  const championTeam = finalMatch && finalMatch.status === 'FINISHED'
    ? finalMatch.homeScore > finalMatch.awayScore
      ? finalMatch.homeTeam
      : finalMatch.awayScore > finalMatch.homeScore
      ? finalMatch.awayTeam
      : null
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all space-y-4">
      {/* Header: Title & Action Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle} ({selectedGrade}학년)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grade selector pill */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {(['1', '2', '3'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {g}학년
              </button>
            ))}
          </div>

          {onOpenFullBracket && (
            <button
              type="button"
              onClick={onOpenFullBracket}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-emerald-400 flex items-center gap-0.5 transition cursor-pointer shrink-0 ml-1"
            >
              <span>전체 대진표</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sport Selector Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {availableSports.map((s) => (
          <button
            key={s.type}
            type="button"
            onClick={() => handleSportChange(s.type)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeSport === s.type
                ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{s.label}</span>
            <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${
              activeSport === s.type ? 'bg-red-700 dark:bg-emerald-600 text-red-100 dark:text-slate-950' : 'bg-white/60 dark:bg-slate-700 text-slate-500'
            }`}>
              {s.genderNote}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {isRelay ? (
        /* Relay / Time-Trial Summary */
        <div className="space-y-2.5">
          {filteredMatches.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {selectedGrade}학년 {availableSports.find(s => s.type === activeSport)?.label} 경기 일정이 등록되어 있지 않습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredMatches.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  onClick={onOpenFullBracket}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-red-400 transition cursor-pointer space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{m.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      m.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                      m.status === 'FINISHED' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {m.status === 'LIVE' ? 'LIVE' : m.status === 'FINISHED' ? '종료' : '예정'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{m.homeTeam} vs {m.awayTeam}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} : ${m.awayScore}` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tournament Bracket Node View (SF1, SF2 -> Final) */
        <div className="space-y-3">
          {championTeam && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                {selectedGrade}학년 {availableSports.find(s => s.type === activeSport)?.label} 최종 우승팀
              </span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{championTeam}</span>
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>{selectedGrade}학년 {availableSports.find(s => s.type === activeSport)?.label} 대진표가 아직 등록되지 않았습니다.</p>
              {onOpenFullBracket && (
                <button
                  type="button"
                  onClick={onOpenFullBracket}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                >
                  대진표 탭에서 전체 경기 확인하기 →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              {/* Semifinals */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
                  <span>준결승 (4강)</span>
                </div>

                {/* SF1 */}
                <div
                  onClick={onOpenFullBracket}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/70 text-xs space-y-1.5 cursor-pointer hover:border-red-400 dark:hover:border-emerald-500 transition"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-300">
                    <span>{sf1?.round || sf1?.title || '4강 1경기'}</span>
                    <span className="font-mono">{sf1?.court || ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold">
                    <span className="truncate">{sf1?.homeTeam || '8강 승자'}</span>
                    <span className="font-mono text-red-600 dark:text-emerald-400 font-bold ml-2">
                      {sf1 ? (sf1.status === 'FINISHED' || sf1.status === 'LIVE' ? sf1.homeScore : '-') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                    <span className="truncate">{sf1?.awayTeam || '8강 승자'}</span>
                    <span className="font-mono font-bold ml-2">
                      {sf1 ? (sf1.status === 'FINISHED' || sf1.status === 'LIVE' ? sf1.awayScore : '-') : '-'}
                    </span>
                  </div>
                </div>

                {/* SF2 */}
                <div
                  onClick={onOpenFullBracket}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/70 text-xs space-y-1.5 cursor-pointer hover:border-red-400 dark:hover:border-emerald-500 transition"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-300">
                    <span>{sf2?.round || sf2?.title || '4강 2경기'}</span>
                    <span className="font-mono">{sf2?.court || ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold">
                    <span className="truncate">{sf2?.homeTeam || '8강 승자'}</span>
                    <span className="font-mono text-red-600 dark:text-emerald-400 font-bold ml-2">
                      {sf2 ? (sf2.status === 'FINISHED' || sf2.status === 'LIVE' ? sf2.homeScore : '-') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                    <span className="truncate">{sf2?.awayTeam || '8강 승자'}</span>
                    <span className="font-mono font-bold ml-2">
                      {sf2 ? (sf2.status === 'FINISHED' || sf2.status === 'LIVE' ? sf2.awayScore : '-') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Finals Card */}
              <div>
                <div className="text-[11px] font-bold text-red-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>결승전 (우승 결정전)</span>
                </div>

                <div
                  onClick={onOpenFullBracket}
                  className="rounded-xl border-2 border-red-500 dark:border-emerald-500/80 p-4 bg-slate-50/60 dark:bg-slate-800/80 text-xs shadow-xs space-y-2.5 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-emerald-400">
                    <span>{finalMatch?.title || '결승전'}</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-300 font-normal">
                      <MapPin className="w-3 h-3" />
                      {finalMatch?.court || '대운동장'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      <span className="truncate">{finalMatch?.homeTeam || '4강 1G 승자'}</span>
                      <span className="font-mono text-red-600 dark:text-emerald-400 font-black text-base ml-2">
                        {finalMatch ? (finalMatch.status === 'FINISHED' || finalMatch.status === 'LIVE' ? finalMatch.homeScore : '-') : '-'}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      <span className="truncate">{finalMatch?.awayTeam || '4강 2G 승자'}</span>
                      <span className="font-mono text-slate-900 dark:text-white font-black text-base ml-2">
                        {finalMatch ? (finalMatch.status === 'FINISHED' || finalMatch.status === 'LIVE' ? finalMatch.awayScore : '-') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {finalMatch?.startTime ? formatKSTTime(finalMatch.startTime) : '16:30 예정'}
                    </span>
                    <span className="text-red-600 dark:text-emerald-400 font-bold">
                      상세보기 →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
