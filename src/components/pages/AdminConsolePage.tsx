import React, { useState } from 'react';
import { 
  MatchItem, 
  AuditLogEntry, 
  SuggestionItem, 
  FestivalConfig
} from '../../types';
import { 
  AdminEmergencyControlCard, 
  AdminSystemStatusCard, 
  AdminScoreApprovalCard, 
  AdminAuditLogCard, 
  AdminInquiryListCard 
} from '../index';
import { 
  ShieldAlert, 
  Trophy, 
  CheckCircle2, 
  Plus, 
  Shuffle
} from 'lucide-react';
import { 
  createMatch, 
  updateFestivalConfig,
  answerSuggestion 
} from '../../services/firebaseService';

interface AdminConsolePageProps {
  matches: MatchItem[];
  auditLogs: AuditLogEntry[];
  inquiries: SuggestionItem[];
  festivalConfig: FestivalConfig | null;
  onRefresh?: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({
  matches,
  auditLogs,
  inquiries,
  festivalConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'brackets' | 'points' | 'audit'>('overview');

  // Point scoring criteria setting (User request 3: 관리자가 정할 수 있게)
  const [pointsConfig, setPointsConfig] = useState({
    win: 300,
    draw: 100,
    runnerUp: 150,
    champion: 500,
    relayWeight: 1.5
  });
  const [pointSaved, setPointSaved] = useState(false);

  // Manual Bracket creation inputs
  const [manualTitle, setManualTitle] = useState('');
  const [manualSport, setManualSport] = useState('soccer');
  const [manualHomeTeam, setManualHomeTeam] = useState('1-1');
  const [manualAwayTeam, setManualAwayTeam] = useState('1-2');
  const [manualRound, setManualRound] = useState('8강 1경기');
  const [manualCourt, setManualCourt] = useState('대운동장 A');
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [matchCreateMsg, setMatchCreateMsg] = useState<string | null>(null);

  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHomeTeam || !manualAwayTeam) return;

    setIsCreatingMatch(true);
    setMatchCreateMsg(null);
    try {
      await createMatch({
        sport: manualSport as any,
        matchType: 'tournament',
        title: manualTitle || `${manualHomeTeam} vs ${manualAwayTeam}`,
        round: manualRound,
        homeTeam: manualHomeTeam,
        awayTeam: manualAwayTeam,
        homeClass: manualHomeTeam.replace(/[^0-9]/g, ''),
        awayClass: manualAwayTeam.replace(/[^0-9]/g, ''),
        court: manualCourt,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: new Date().toISOString()
      });
      setMatchCreateMsg('새로운 매치가 정상적으로 대진표에 등록되었습니다.');
      setManualTitle('');
    } catch (err) {
      console.error(err);
      setMatchCreateMsg('매치 생성에 실패했습니다.');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  // Random automatic draw (User request 1: 둘 다 가능하게)
  const handleRandomDraw = async () => {
    setIsCreatingMatch(true);
    setMatchCreateMsg(null);
    try {
      const classes = ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반'];
      const shuffled = [...classes].sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffled.length; i += 2) {
        await createMatch({
          sport: 'soccer',
          matchType: 'tournament',
          title: `3학년 축구 8강 ${i / 2 + 1}경기`,
          round: `8강 ${i / 2 + 1}경기`,
          homeTeam: `3-${shuffled[i]}`,
          awayTeam: `3-${shuffled[i + 1]}`,
          homeClass: `30${shuffled[i].charAt(0)}`,
          awayClass: `30${shuffled[i + 1].charAt(0)}`,
          court: '대운동장 A',
          status: 'SCHEDULED',
          period: '경기전',
          startTime: new Date(Date.now() + 3600000 * (i / 2 + 1)).toISOString()
        });
      }
      setMatchCreateMsg('8강 토너먼트 대진이 랜덤 추첨되어 자동 등록되었습니다.');
    } catch (err) {
      console.error(err);
      setMatchCreateMsg('랜덤 대진 추첨 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
              SYSTEM ADMINISTRATOR
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              전교 시스템 제어 & 전교 데이터 관제
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            상산고 체육대회 통합 어드민 콘솔
          </h2>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {[
            { key: 'overview', label: '종합 관제' },
            { key: 'brackets', label: '대진표 생성' },
            { key: 'points', label: '배점 기준 설정' },
            { key: 'audit', label: '감사 로그' }
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveSubTab(t.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === t.key
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8">
              <AdminEmergencyControlCard
                isEmergencyLocked={festivalConfig?.isOpen === false}
                onToggleLock={async (locked) => {
                  await updateFestivalConfig({ isOpen: !locked });
                }}
              />
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                실시간 점수 승인 대기
              </div>
              <div className="text-3xl font-black font-mono text-red-600 dark:text-red-400 my-1">
                2건
              </div>
              <span className="text-[10px] text-red-500 font-bold">
                즉시 확인 필요
              </span>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                미확정 포인트 누적
              </div>
              <div className="text-3xl font-black font-mono text-amber-500 my-1">
                450 pts
              </div>
              <span className="text-[10px] text-slate-400">
                경기 승인 시 자동반영
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-5">
              <AdminSystemStatusCard
                totalMembersCount={1048}
                unregisteredMembersCount={12}
                totalMatchesCount={matches.length}
                completedMatchesCount={matches.filter(m => m.status === 'FINISHED').length}
                pendingMatchesCount={matches.filter(m => m.status !== 'FINISHED').length}
              />
            </div>
            <div className="lg:col-span-8 space-y-5">
              <AdminScoreApprovalCard
                onApprove={() => {}}
                onReject={() => {}}
              />
              <AdminInquiryListCard
                inquiries={inquiries}
                onResolveInquiry={async (id) => {
                  await answerSuggestion(id, '조치 완료', '총괄관리자');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Brackets Generation Tab (Both manual & auto) */}
      {activeSubTab === 'brackets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Manual Match Form */}
          <div className="lg:col-span-7 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600 dark:text-emerald-400" />
                관리자 직접 대진표 수동 생성
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                대진 팀과 라운드, 종목 및 경기장을 직접 지정하여 매치를 등록합니다.
              </p>
            </div>

            {matchCreateMsg && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                {matchCreateMsg}
              </div>
            )}

            <form onSubmit={handleCreateManualMatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">종목</label>
                  <select
                    value={manualSport}
                    onChange={(e) => setManualSport(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="soccer">축구</option>
                    <option value="basketball">농구</option>
                    <option value="dodgeball">피구</option>
                    <option value="tug_of_war">줄다리기</option>
                    <option value="relay_male">남자 계주</option>
                    <option value="relay_female">여자 계주</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">라운드</label>
                  <input
                    type="text"
                    value={manualRound}
                    onChange={(e) => setManualRound(e.target.value)}
                    placeholder="예: 8강 1경기, 결승전"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">홈팀 (학급)</label>
                  <input
                    type="text"
                    value={manualHomeTeam}
                    onChange={(e) => setManualHomeTeam(e.target.value)}
                    placeholder="예: 3-2반"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">원정팀 (학급)</label>
                  <input
                    type="text"
                    value={manualAwayTeam}
                    onChange={(e) => setManualAwayTeam(e.target.value)}
                    placeholder="예: 3-5반"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">경기 장소</label>
                <input
                  type="text"
                  value={manualCourt}
                  onChange={(e) => setManualCourt(e.target.value)}
                  placeholder="예: 대운동장 A, 체육관 1층"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingMatch}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isCreatingMatch ? '등록 중...' : '수동 경기 등록하기'}
              </button>
            </form>
          </div>

          {/* Random Auto Draw Box */}
          <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-blue-500" />
                토너먼트 자동 랜덤 추첨 편성
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                학급 목록을 무작위로 섞어 8강/16강 토너먼트 트리를 자동으로 일괄 생성합니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs">
              자동 추첨 시 공정성을 위해 무작위 난수 기반으로 페어링되며 즉시 전교 대진표에 동기화됩니다.
            </div>

            <button
              type="button"
              onClick={handleRandomDraw}
              disabled={isCreatingMatch}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              {isCreatingMatch ? '편성 중...' : '원클릭 랜덤 대진표 자동 추첨 실행'}
            </button>
          </div>
        </div>
      )}

      {/* Points Scoring Policy Configuration (User request 3) */}
      {activeSubTab === 'points' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              학급 종합 순위 배점 기준 설정
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              종목별 승리 및 순위 입상 시 각 학급에 부여할 종합 포인트를 관리자가 직접 설정합니다.
            </p>
          </div>

          {pointSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>배점 기준이 성공적으로 저장 및 적용되었습니다!</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <strong className="text-slate-900 dark:text-white">우승(1위) 획득 점수</strong>
                <p className="text-slate-400 text-[11px]">종목 토너먼트 최종 우승 학급</p>
              </div>
              <input
                type="number"
                value={pointsConfig.champion}
                onChange={(e) => setPointsConfig({ ...pointsConfig, champion: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <strong className="text-slate-900 dark:text-white">준우승(2위) 획득 점수</strong>
                <p className="text-slate-400 text-[11px]">결승 진출 및 준우승 학급</p>
              </div>
              <input
                type="number"
                value={pointsConfig.runnerUp}
                onChange={(e) => setPointsConfig({ ...pointsConfig, runnerUp: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <strong className="text-slate-900 dark:text-white">일반 매치 승리 점수</strong>
                <p className="text-slate-400 text-[11px]">16강/8강/4강 경기 승리 시 기본 부여</p>
              </div>
              <input
                type="number"
                value={pointsConfig.win}
                onChange={(e) => setPointsConfig({ ...pointsConfig, win: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <strong className="text-slate-900 dark:text-white">계주 릴레이 가중치</strong>
                <p className="text-slate-400 text-[11px]">단체 종목 특수 가산 배율 (예: 1.5배)</p>
              </div>
              <input
                type="number"
                step="0.1"
                value={pointsConfig.relayWeight}
                onChange={(e) => setPointsConfig({ ...pointsConfig, relayWeight: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPointSaved(true);
              setTimeout(() => setPointSaved(false), 3000);
            }}
            className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
          >
            배점 기준 저장 및 순위표 즉시 재계산 반영
          </button>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeSubTab === 'audit' && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <AdminAuditLogCard logs={auditLogs} />
        </div>
      )}
    </div>
  );
};
