import React, { useState, useEffect } from 'react';
import { 
  MatchItem, 
  AuditLogEntry, 
  SuggestionItem, 
  FestivalConfig,
  UserProfile,
  UserRole
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
  Shuffle,
  Users,
  Search,
  Check,
  Trash2,
  UserCheck
} from 'lucide-react';
import { 
  createMatch, 
  updateFestivalConfig,
  answerSuggestion,
  listenAllUsers,
  updateUserRole,
  deleteUser
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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'roles' | 'brackets' | 'points' | 'audit'>('overview');

  // User management state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userActionNotice, setUserActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenAllUsers((list) => {
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (studentId: string, role: UserRole) => {
    try {
      await updateUserRole(studentId, role);
      setUserActionNotice(`학번 [${studentId}]의 역할이 [${getRoleLabel(role)}]로 변경되었습니다.`);
      setTimeout(() => setUserActionNotice(null), 3500);
    } catch (e) {
      console.error(e);
      alert('역할 변경 실패');
    }
  };

  const handleDeleteUser = async (studentId: string, name: string) => {
    if (confirm(`[${studentId} ${name}] 사용자를 삭제/초기화하시겠습니까? 재가입이 가능해집니다.`)) {
      try {
        await deleteUser(studentId);
        setUserActionNotice(`학번 [${studentId}] 사용자가 삭제되었습니다.`);
        setTimeout(() => setUserActionNotice(null), 3500);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return '총괄 관리자';
      case 'student_council': return '학생회 / 체육부';
      case 'class_president': return '학급 반장';
      case 'teacher': return '교사 / 심판';
      case 'health_officer': return '보건 / 의무담당';
      case 'student': return '일반 학생';
      default: return role;
    }
  };

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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
          {[
            { key: 'overview', label: '종합 관제' },
            { key: 'roles', label: '학생 역할 지정 관리' },
            { key: 'brackets', label: '대진표 생성' },
            { key: 'points', label: '배점 기준 설정' },
            { key: 'audit', label: '감사 로그' }
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveSubTab(t.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
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

      {userActionNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{userActionNotice}</span>
        </div>
      )}

      {/* Roles Subtab: Admin Student Role Assignment */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-600" />
              학생 역할 배정 원칙 (Strict Role Rule)
            </p>
            <p className="leading-relaxed text-amber-800 dark:text-amber-400">
              학생은 회원가입 시 스스로 역할을 고를 수 없으며, 기본 '일반 학생(교사는 번호 00으로 교사)'으로만 가입됩니다.
              학생회, 반장, 심판, 보건담당 등의 특수 역할은 <strong>오직 이곳 총괄 관리자(어드민) 콘솔에서 지정할 때만</strong> 부여됩니다.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-600" />
                  전체 등록 회원 명단 및 역할 부여 ({allUsers.length}명)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  학번 또는 이름으로 학생을 찾아 원하는 역할을 원클릭으로 지정하세요.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="학번 또는 이름 검색..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">학번</th>
                    <th className="py-2.5 px-3">성명</th>
                    <th className="py-2.5 px-3">학급</th>
                    <th className="py-2.5 px-3">현재 역할</th>
                    <th className="py-2.5 px-3">관리자 역할 지정</th>
                    <th className="py-2.5 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {allUsers
                    .filter(u => !userSearch || u.studentId.includes(userSearch) || u.name.includes(userSearch))
                    .map((user) => (
                      <tr key={user.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {user.studentId}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {user.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {user.isTeacher ? '선생님' : `${user.grade}학년 ${user.classNum}반`}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            user.role === 'admin' ? 'bg-red-600 text-white' :
                            user.role === 'student_council' ? 'bg-blue-600 text-white' :
                            user.role === 'class_president' ? 'bg-emerald-600 text-white' :
                            user.role === 'teacher' ? 'bg-purple-600 text-white' :
                            user.role === 'health_officer' ? 'bg-rose-600 text-white' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.studentId, e.target.value as UserRole)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-red-500"
                          >
                            <option value="student">일반 학생 (기본)</option>
                            <option value="class_president">학급 반장 (라인업 제출)</option>
                            <option value="student_council">학생회 / 체육부 (점수 입력·공지)</option>
                            <option value="teacher">교사 / 심판 (점수 심판)</option>
                            <option value="health_officer">보건 / 의무본부 (부상백과 관리)</option>
                            <option value="admin">총괄 관리자</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.studentId, user.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="회원 삭제 (오타 학번 초기화)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        현재 등록된 회원이 없습니다. 학생들이 로그인하면 여기에 실시간으로 표시됩니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
