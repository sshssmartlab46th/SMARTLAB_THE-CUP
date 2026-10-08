import React, { useState } from 'react';
import { FallbackSnapshotData } from '../../utils/fallbackSnapshot';
import { getSportScoreMeta } from '../../utils/sportScoreUtils';
import { WifiOff, RefreshCw, AlertTriangle, ShieldCheck, Trophy, Calendar, Bell } from 'lucide-react';

interface OfflineFallbackPageProps {
  snapshot: FallbackSnapshotData | null;
  onRetryConnection?: () => void;
  onExitFallbackMode?: () => void;
  isOnline?: boolean;
}

const SPORTS_LIST = [
  { key: 'soccer', name: '축구' },
  { key: 'basketball', name: '농구' },
  { key: 'dodgeball', name: '피구' },
  { key: 'tug_of_war', name: '줄다리기' },
  { key: 'relay_male', name: '남자 계주' },
  { key: 'relay_female', name: '여자 계주' }
];

export function OfflineFallbackPage({
  snapshot,
  onRetryConnection,
  onExitFallbackMode,
  isOnline = false
}: OfflineFallbackPageProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'notices'>('matches');
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('all');

  const matches = snapshot?.matches || [];
  const notices = snapshot?.notices || [];
  const standings = snapshot?.standings || [];
  const lastUpdated = snapshot?.lastUpdatedLabel || '저장된 데이터 없음';

  const filteredMatches = selectedSportFilter === 'all'
    ? matches
    : matches.filter((m) => m.sport === selectedSportFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Offline / Emergency Fallback Banner */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 backdrop-blur-md shadow-lg transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <WifiOff className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  대회 비상 읽기 전용 모드 (정적 스냅샷)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  폴백 활성화
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                서버 또는 네트워크 접속 불안정 시에도 최신 경기 스코어와 안내를 확인하실 수 있도록 정적 스냅샷을 표시하고 있습니다.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                <span>마지막 동기화 시각: <strong className="text-slate-700 dark:text-slate-200">{lastUpdated}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            {onRetryConnection && (
              <button
                onClick={onRetryConnection}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>재연결 시도</span>
              </button>
            )}
            {isOnline && onExitFallbackMode && (
              <button
                onClick={onExitFallbackMode}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>실시간 모드로 복귀</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!snapshot ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-8 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            저장된 데이터 스냅샷이 없습니다.
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            이전에 서버에 정상 연결된 기록이 없거나 로컬 스토리지에 스냅샷이 저장되지 않았습니다.
          </p>
          {onRetryConnection && (
            <button
              onClick={onRetryConnection}
              className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              네트워크 재연결 시도
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 2. Secondary Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              경기 일정 및 결과 ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'standings'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              종합 학급 순위 ({standings.length})
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'notices'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              공지사항 ({notices.length})
            </button>
          </div>

          {/* 3. Tab Content */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {/* Sport Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedSportFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSportFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  전체 종목
                </button>
                {SPORTS_LIST.map((sp) => (
                  <button
                    key={sp.key}
                    onClick={() => setSelectedSportFilter(sp.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedSportFilter === sp.key
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>

              {filteredMatches.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                  해당 종목에 저장된 경기 스냅샷이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map((m) => {
                    const sportCfg = getSportScoreMeta(m.sport);
                    const isFinished = m.status === 'FINISHED';
                    const isLive = m.status === 'LIVE' || m.status === 'PAUSED';

                    return (
                      <div
                        key={m.id}
                        className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span>{sportCfg.sportIcon}</span>
                            <span>{sportCfg.sportName}</span>
                            <span className="text-slate-400">•</span>
                            <span>{m.round || '예선'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            isLive
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : isFinished
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {isLive ? 'LIVE (스냅샷)' : isFinished ? '경기 종료' : m.time || '예정'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between my-3 px-2">
                          <div className="text-center flex-1">
                            <span className="block font-bold text-base text-slate-800 dark:text-slate-100">
                              {m.homeTeam || `${m.homeClass}반`}
                            </span>
                          </div>
                          <div className="px-4 text-center shrink-0">
                            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
                              {m.homeScore ?? 0} : {m.awayScore ?? 0}
                            </span>
                          </div>
                          <div className="text-center flex-1">
                            <span className="block font-bold text-base text-slate-800 dark:text-slate-100">
                              {m.awayTeam || `${m.awayClass}반`}
                            </span>
                          </div>
                        </div>

                        {m.court && (
                          <div className="text-xs text-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2 mt-2">
                            경기 장소: {m.court}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'standings' && (
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  스냅샷 기준 종합 학급 순위
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">총 {standings.length}개 반</span>
              </div>
              {standings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  저장된 순위 정보 스냅샷이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {standings.slice(0, 12).map((item, idx) => (
                    <div key={item.id || idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {item.className || `${item.grade}-${item.classNum}반`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.wins || 0}승 {item.draws || 0}무 {item.losses || 0}패
                        </span>
                        <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                          {item.points ?? item.totalPoints ?? 0} P
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-3">
              {notices.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                  저장된 공지사항 스냅샷이 없습니다.
                </div>
              ) : (
                notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {n.important && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            중요
                          </span>
                        )}
                        {n.title}
                      </span>
                      <span className="text-xs text-slate-400">{n.date || '대회 공지'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
