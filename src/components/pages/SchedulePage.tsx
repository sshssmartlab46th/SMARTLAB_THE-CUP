import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import { Calendar, Clock, MapPin, Bell, BellRing, Filter, Search } from 'lucide-react';
import { parseMatchStartTime, formatKSTTime } from '../../services/firebaseService';

interface SchedulePageProps {
  matches: MatchItem[];
  userReminders: string[];
  onToggleReminder: (match: MatchItem) => void;
  onSelectMatch: (match: MatchItem) => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  matches,
  userReminders,
  onToggleReminder,
  onSelectMatch
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const sportsList = [
    { key: 'all', label: '전체 종목' },
    { key: 'soccer', label: '축구' },
    { key: 'basketball', label: '농구' },
    { key: 'dodgeball', label: '피구' },
    { key: 'tug_of_war', label: '줄다리기' },
    { key: 'relay_male', label: '남자 계주' },
    { key: 'relay_female', label: '여자 계주' }
  ];

  const filteredMatches = matches.filter(m => {
    if (selectedSport !== 'all' && m.sport !== selectedSport) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      const matchText = `${m.title} ${m.round} ${m.homeTeam} ${m.awayTeam} ${m.court}`.toLowerCase();
      return matchText.includes(kw);
    }
    return true;
  });

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    if (timeStr.includes(':') && timeStr.length <= 5) return timeStr;
    return formatKSTTime(timeStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600 dark:text-emerald-400" />
            대회 전체 경기 일정표
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            상산고등학교 체육대회 모든 종목별 경기 시간, 코트 및 알림을 관리합니다.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="학급, 종목, 경기장 검색..."
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500 transition"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
        </div>
      </div>

      {/* Sport Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sportsList.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSelectedSport(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedSport === s.key
                ? 'bg-red-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Schedule Table/Cards */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
          등록되었거나 검색 조건에 맞는 경기 일정이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map(m => {
            const hasReminder = userReminders.includes(m.id);
            const isLive = m.status === 'LIVE';
            const isFinished = m.status === 'FINISHED';
            const startTimeEpoch = parseMatchStartTime(m.startTime);
            const isDue = m.status === 'SCHEDULED' && Boolean(startTimeEpoch && startTimeEpoch <= Date.now());

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between ${
                  isLive
                    ? 'border-2 border-red-500 dark:border-emerald-500'
                    : isDue
                    ? 'border-2 border-amber-400 dark:border-amber-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(m.startTime)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLive
                        ? 'bg-red-600 text-white animate-pulse'
                        : isDue
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isFinished
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}>
                      {isLive ? '진행중' : isDue ? '시각도달' : isFinished ? '완료' : '예정'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {m.title} {m.round ? `(${m.round})` : ''}
                  </h3>

                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                    <span className="truncate max-w-[110px]">{m.homeTeam}</span>
                    {isFinished || isLive ? (
                      <div className="text-center px-1">
                        <span className="font-mono text-red-600 dark:text-emerald-400 font-black">
                          {m.homeScore} : {m.awayScore}
                        </span>
                        {((m.penaltyShootout && (m.homeScore === m.awayScore || m.isPenaltyShootout)) || m.period?.includes('승부차기')) && (
                          <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 font-mono leading-none mt-0.5">
                            PK ({m.penaltyShootout?.homeScore ?? 0}:{m.penaltyShootout?.awayScore ?? 0})
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">vs</span>
                    )}
                    <span className="truncate max-w-[110px] text-right">{m.awayTeam}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{m.court || '대운동장'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMatch(m)}
                    className="text-xs text-red-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    경기 상황 보기 &rarr;
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleReminder(m)}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center gap-1 ${
                      hasReminder
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {hasReminder ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{hasReminder ? '알림 켜짐' : '알림 설정'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
