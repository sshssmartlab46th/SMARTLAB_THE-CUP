import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import { Trophy, Clock, MapPin, Bell, BellRing, ChevronRight, Activity, Flame, Filter } from 'lucide-react';

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
  const [selectedGrade, setSelectedGrade] = useState<'all' | '1' | '2' | '3'>('all');

  const sportsList: { key: SportType; label: string; genderNote: string }[] = [
    { key: 'soccer', label: '축구', genderNote: '남자 8개 반 (8강)' },
    { key: 'basketball', label: '농구', genderNote: '남자 8개 반 (8강)' },
    { key: 'dodgeball', label: '피구', genderNote: '여자 4개 반 (4강)' },
    { key: 'relay_male', label: '남자 계주', genderNote: '남자 8개 반 릴레이' },
    { key: 'relay_female', label: '여자 계주', genderNote: '여자 4개 반 릴레이' },
    { key: 'tug_of_war', label: '줄다리기', genderNote: '단판 / 토너먼트' },
    { key: 'group_rope', label: '단체 줄넘기', genderNote: '기록 측정' }
  ];

  // Filter matches by sport and grade
  const sportMatches = matches.filter((m) => {
    if (m.sport !== sport) return false;
    if (selectedGrade !== 'all') {
      const matchGrade = m.homeClass ? m.homeClass.charAt(0) : m.title.charAt(0);
      if (matchGrade !== selectedGrade) return false;
    }
    return true;
  });

  const isRelay = sport === 'relay_male' || sport === 'relay_female';

  return (
    <div className="space-y-4">
      {/* Grade Selector & Sport Bar */}
      <div className="space-y-2">
        {/* Grade Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            학년 필터:
          </span>
          {[
            { key: 'all', label: '전체 학년' },
            { key: '1', label: '1학년' },
            { key: '2', label: '2학년' },
            { key: '3', label: '3학년' }
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

        {/* Sport Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {sportsList.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectSport(s.key)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                sport === s.key
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                sport === s.key ? 'bg-red-700 text-red-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {s.genderNote}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isRelay ? (
        /* Relay Race Format */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {sport === 'relay_male' ? '남자 계주 릴레이 (1~4반, 9~12반)' : '여자 계주 릴레이 (5~8반)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedGrade === 'all' ? '전체 학년' : `${selectedGrade}학년`} 릴레이 트랙 일정 및 레인 기록
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              트랙 종목
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sportMatches.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                선택한 조건의 계주 일정이 없습니다.
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
                        {m.startTime ? new Date(m.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
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
                        <div className="text-[10px] text-slate-400">1레인</div>
                      </div>
                      <div className="text-base font-black font-mono text-red-600 dark:text-red-400">
                        {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} : ${m.awayScore}` : 'VS'}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">{m.awayTeam}</div>
                        <div className="text-[10px] text-slate-400">2레인</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Tournament Bracket Layout */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {sportsList.find((s) => s.key === sport)?.label} 대진표 ({selectedGrade === 'all' ? '전학년' : `${selectedGrade}학년`})
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
            <div className="py-12 text-center text-xs text-slate-400">
              해당 종목 및 학년에 등록된 경기 대진표가 없습니다.
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
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
                          {m.status === 'LIVE' ? 'LIVE' : m.status === 'FINISHED' ? '종료' : '대기'}
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
                        title="경기 시작 10분 전 알림"
                      >
                        {hasReminder ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isHomeWinner ? 'text-red-600 dark:text-red-400 font-black' : 'text-slate-900 dark:text-white'}`}>
                          {m.homeTeam}
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {m.homeScore ?? '-'}
                        </span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isAwayWinner ? 'text-red-600 dark:text-red-400 font-black' : 'text-slate-900 dark:text-white'}`}>
                          {m.awayTeam}
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {m.awayScore ?? '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {m.startTime ? new Date(m.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'} · {m.court}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-semibold flex items-center">
                        상세보기 <ChevronRight className="w-3 h-3" />
                      </span>
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
