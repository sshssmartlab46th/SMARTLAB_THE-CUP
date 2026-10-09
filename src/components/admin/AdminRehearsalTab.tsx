import React, { useState, useEffect, useRef } from 'react';
import { MatchItem, SportType } from '../../types';
import {
  generateMockRehearsalMatches,
  simulateRandomMatchStep,
  simulateCompleteRound,
  saveRehearsalBackup,
  loadRehearsalBackup,
  clearRehearsalBackup,
  SimulationLogEntry
} from '../../services/rehearsalSimulationService';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FastForward
} from 'lucide-react';

interface AdminRehearsalTabProps {
  matches: MatchItem[];
  onNotice?: (msg: string) => void;
  onUpdateMatches?: (updatedMatches: MatchItem[]) => void;
}

export const AdminRehearsalTab: React.FC<AdminRehearsalTabProps> = ({
  matches,
  onNotice,
  onUpdateMatches
}) => {
  const [isRehearsalActive, setIsRehearsalActive] = useState<boolean>(() => {
    return matches.some((m) => m.id.startsWith('rehearsal-sim-'));
  });
  const [isAutoLoopActive, setIsAutoLoopActive] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<SimulationLogEntry[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  const autoLoopRef = useRef<NodeJS.Timeout | null>(null);
  const matchesRef = useRef<MatchItem[]>(matches);

  useEffect(() => {
    matchesRef.current = matches;
    setIsRehearsalActive(matches.some((m) => m.id.startsWith('rehearsal-sim-')));
  }, [matches]);

  // Clean up auto loop timer on unmount
  useEffect(() => {
    return () => {
      if (autoLoopRef.current) {
        clearInterval(autoLoopRef.current);
      }
    };
  }, []);

  const addLog = (log: SimulationLogEntry) => {
    setSimLogs((prev) => [log, ...prev.slice(0, 49)]);
  };

  // 1. Start Rehearsal Mode
  const handleStartRehearsal = () => {
    // Save current prod matches backup
    saveRehearsalBackup(matches);

    const mockMatches = generateMockRehearsalMatches();
    if (onUpdateMatches) {
      onUpdateMatches(mockMatches);
    }
    setIsRehearsalActive(true);

    const startLog: SimulationLogEntry = {
      id: `log-init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      matchTitle: '대회 리허설 시뮬레이터',
      sport: 'soccer',
      grade: '전체',
      action: '리허설 모드 개시',
      detail: '전학년 가짜 대회 경기 데이터 세트(8강/4강/결승)가 로드되었습니다.'
    };
    addLog(startLog);
    onNotice?.('대회 리허설(시뮬레이션) 모드가 개시되었습니다.');
  };

  // 2. Stop Rehearsal & Restore Data
  const handleStopRehearsal = () => {
    if (autoLoopRef.current) {
      clearInterval(autoLoopRef.current);
      autoLoopRef.current = null;
      setIsAutoLoopActive(false);
    }

    const backup = loadRehearsalBackup();
    clearRehearsalBackup();

    if (backup && onUpdateMatches) {
      onUpdateMatches(backup);
    } else if (onUpdateMatches) {
      // Filter out rehearsal matches if no backup found
      onUpdateMatches(matches.filter((m) => !m.id.startsWith('rehearsal-sim-')));
    }

    setIsRehearsalActive(false);
    onNotice?.('리허설 모드가 종료되고 원본 대회 데이터로 복원되었습니다.');
  };

  // 3. Step execution (single match step)
  const handleRunSingleStep = () => {
    if (!isRehearsalActive) return;
    const { updatedMatches, log } = simulateRandomMatchStep(matchesRef.current);
    if (onUpdateMatches) {
      onUpdateMatches(updatedMatches);
    }
    if (log) {
      addLog(log);
    }
  };

  // 4. Toggle Auto Loop
  const handleToggleAutoLoop = () => {
    if (isAutoLoopActive) {
      if (autoLoopRef.current) {
        clearInterval(autoLoopRef.current);
        autoLoopRef.current = null;
      }
      setIsAutoLoopActive(false);
      onNotice?.('자동 시뮬레이션 루프가 일시 정지되었습니다.');
    } else {
      if (!isRehearsalActive) {
        handleStartRehearsal();
      }
      setIsAutoLoopActive(true);
      autoLoopRef.current = setInterval(() => {
        handleRunSingleStep();
      }, 3000);
      onNotice?.('3초 주기 자동 시뮬레이션 루프가 가동되었습니다.');
    }
  };

  // 5. Complete whole round (8-gang -> 4-gang auto advance)
  const handleSimulateCompleteRound = async (grade: string, sport: SportType) => {
    if (!isRehearsalActive) {
      handleStartRehearsal();
    }
    const { updatedMatches, logs } = await simulateCompleteRound(matches, grade, sport, 'QF');
    if (onUpdateMatches) {
      onUpdateMatches(updatedMatches);
    }
    logs.forEach((txt, idx) => {
      addLog({
        id: `round-log-${Date.now()}-${idx}`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        matchTitle: `${grade}학년 ${sport.toUpperCase()} 8강전`,
        sport,
        grade,
        action: '8강전 일괄 종료 & 4강 진출',
        detail: txt
      });
    });
    onNotice?.(`[${grade}학년 ${sport}] 8강전 완료 및 4강 대진 자동 진출 시뮬레이션 완료!`);
  };

  // Filtered view
  const rehearsalMatches = matches.filter((m) => m.id.startsWith('rehearsal-sim-'));
  const displayMatches = rehearsalMatches.filter((m) => {
    if (selectedGrade !== 'all' && m.homeClass?.charAt(0) !== selectedGrade) return false;
    if (selectedSport !== 'all' && m.sport !== selectedSport) return false;
    return true;
  });

  const liveCount = rehearsalMatches.filter((m) => m.status === 'LIVE').length;
  const finishedCount = rehearsalMatches.filter((m) => m.status === 'FINISHED').length;
  const scheduledCount = rehearsalMatches.filter((m) => m.status === 'SCHEDULED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Status */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isRehearsalActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{isRehearsalActive ? '🎮 리허설(시뮬레이션) 모드 가동중' : '⏸️ 일반 실제 운영 모드'}</span>
              </span>
              {isAutoLoopActive && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>3초 자동 가동중</span>
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              대회 전과정 리허설(시뮬레이션) 관제 콘솔
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              가짜 경기 데이터를 생성하여 점수 입력, 스코어보드 업데이트, 8강전 일괄 종료 후 4강/결승 대진 자동 진출까지 전체 체육대회 운영 흐름을 리허설해보세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isRehearsalActive ? (
              <button
                type="button"
                onClick={handleStartRehearsal}
                className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>리허설 데이터 생성 & 모드 시작</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleAutoLoop}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    isAutoLoopActive
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isAutoLoopActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isAutoLoopActive ? '자동 루프 일시정지' : '3초 자동 루프 시작'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunSingleStep}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="랜덤 경기 1개에 대해 점수 또는 득점 발생 시뮬레이션"
                >
                  <FastForward className="w-4 h-4 text-amber-400" />
                  <span>수동 1단계 진행</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopRehearsal}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-red-900/50 text-red-300 font-bold text-xs border border-slate-700 hover:border-red-700/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>리허설 종료 & 데이터 원복</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Rehearsal Statistics Bar */}
        {isRehearsalActive && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">생성된 가짜 경기</span>
              <span className="text-base font-extrabold text-white mt-0.5 block">{rehearsalMatches.length} 경기</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">진행중 (LIVE)</span>
              <span className="text-base font-extrabold text-rose-400 mt-0.5 block">{liveCount} 경기</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">종료 (FINISHED)</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">{finishedCount} 경기</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">대기중 (SCHEDULED)</span>
              <span className="text-base font-extrabold text-slate-300 mt-0.5 block">{scheduledCount} 경기</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Action Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <Trophy className="w-4 h-4" />
            <span>2학년 축구 8강 완료 & 4강 진출</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            2학년 축구 8강 1~4경기를 모두 무작위 승리로 종료 처리하고, 4강 1경기/2경기로 승자를 자동 진출시킵니다.
          </p>
          <button
            type="button"
            onClick={() => handleSimulateCompleteRound('2', 'soccer')}
            className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition cursor-pointer"
          >
            2학년 축구 8강 완료 시뮬레이션
          </button>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <Trophy className="w-4 h-4" />
            <span>1학년 농구 8강 완료 & 4강 진출</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            1학년 농구 8강전 4경기를 즉시 마감하여 4강 대진표가 자동으로 완성되는 토너먼트 연동을 테스트합니다.
          </p>
          <button
            type="button"
            onClick={() => handleSimulateCompleteRound('1', 'basketball')}
            className="w-full py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 transition cursor-pointer"
          >
            1학년 농구 8강 완료 시뮬레이션
          </button>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Trophy className="w-4 h-4" />
            <span>3학년 피구 8강 완료 & 4강 진출</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            3학년 피구 8강 승자를 확정짓고 토너먼트 브래킷 컴포넌트에 실시간 반영되는지 확인합니다.
          </p>
          <button
            type="button"
            onClick={() => handleSimulateCompleteRound('3', 'dodgeball')}
            className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition cursor-pointer"
          >
            3학년 피구 8강 완료 시뮬레이션
          </button>
        </div>
      </div>

      {/* Rehearsal Event Log & Live Match Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation Log Log Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              실시간 리허설 로그 피드
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">{simLogs.length} 건</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
            {simLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                상단의 [수동 1단계 진행] 또는 [3초 자동 루프 시작] 버튼을 눌러 시뮬레이션 이벤트 로그를 확인하세요.
              </div>
            ) : (
              simLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-red-600 dark:text-red-400">[{log.timestamp}] {log.action}</span>
                    <span className="text-slate-400">{log.grade}학년 • {log.sport}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{log.matchTitle}</p>
                  <p className="text-slate-500 dark:text-slate-400 leading-snug">{log.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Rehearsal Match Dataset Preview */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              시뮬레이션 경기 데이터셋 목록 ({displayMatches.length})
            </h4>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>

              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">전체 종목</option>
                <option value="soccer">축구</option>
                <option value="basketball">농구</option>
                <option value="dodgeball">피구</option>
                <option value="tug_of_war">줄다리기</option>
              </select>
            </div>
          </div>

          {!isRehearsalActive ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p>현재 리허설 모드가 중지되어 있습니다.</p>
              <p className="text-slate-500">상단의 [리허설 데이터 생성 & 모드 시작] 버튼을 클릭하세요.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {displayMatches.map((m) => (
                <div key={m.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'LIVE'
                          ? 'bg-rose-500 text-white'
                          : m.status === 'FINISHED'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {m.status}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                      <span>{m.court}</span>
                      <span>•</span>
                      <span>{m.period} ({m.elapsedSeconds}초)</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {m.homeTeam} ({m.homeScore}) : ({m.awayScore}) {m.awayTeam}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      이벤트 {m.events?.length || 0}건
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
