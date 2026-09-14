import React, { useState } from 'react';
import { UserProfile, MatchItem, NoticeItem, UserRole, ScoreApprovalRequestItem, FieldIncidentItem, SupplyItem, MedicalIncidentQueueItem, HospitalTransferItem, SubstitutionRecord, MedicalTimelineItem } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  ArrowLeft, 
  Bell, 
  CheckCircle2, 
  Flame,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { formatKSTTime } from '../../utils/kstTime';
import { 
  ClassScopeNoticeCard, 
  ClassRosterManagerCard, 
  ClassLeaderSpecialActionsCard, 
  ClassScheduleInquiryCard,
  StaffPendingResultsCard, 
  StaffInventoryCard, 
  StaffQuickControlCard, 
  StaffFieldIssuesCard,
  RefereeAssignedMatchesCard, 
  RefereeScoreboardCard, 
  RefereeSubmissionQueueCard, 
  RefereeSubstitutionsCard,
  MedicalTriageQueueCard, 
  MedicalSuppliesCard, 
  MedicalEmergencyHotlineCard, 
  MedicalPatientTimelineCard 
} from '../index';
import { updateMatch, updateScoreWithAudit, createNotice, submitScoreApprovalRequest } from '../../services/firebaseService';

interface RoleDashboardPageProps {
  currentUser: UserProfile | null;
  matches: MatchItem[];
  notices: NoticeItem[];
  onBackToHome?: () => void;
}

export const RoleDashboardPage: React.FC<RoleDashboardPageProps> = ({
  currentUser,
  matches,
  notices,
  onBackToHome
}) => {
  // Determine default tab based on user's current role, or default to class_president
  const getInitialRole = (): 'class_president' | 'student_council' | 'referee' | 'health_officer' => {
    if (currentUser?.role === 'student_council') return 'student_council';
    if (currentUser?.role === 'referee') return 'referee';
    if (currentUser?.role === 'health_officer') return 'health_officer';
    return 'class_president';
  };

  const [activeRoleTab, setActiveRoleTab] = useState<'class_president' | 'student_council' | 'referee' | 'health_officer'>(getInitialRole());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Class Leader State & Mock Data
  // -------------------------------------------------------------
  const userClass = currentUser?.grade && currentUser?.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '302';
  const userClassLabel = `${userClass.charAt(0)}학년 ${parseInt(userClass.substring(1), 10)}반`;
  const classMatches = matches.filter(m => m.homeClass === userClass || m.awayClass === userClass);

  const [classRoster, setClassRoster] = useState([
    { id: '1', name: '김태호', sportWithPosition: '축구 (FW/주전)', status: 'CONFIRMED' as const, statusLabel: '참가 확정', nextMatchTime: '오후 1:30 vs 3-4반' },
    { id: '2', name: '이민준', sportWithPosition: '축구 (MF/미드필더)', status: 'CONFIRMED' as const, statusLabel: '참가 확정', nextMatchTime: '오후 1:30 vs 3-4반' },
    { id: '3', name: '박서진', sportWithPosition: '농구 (가드)', status: 'WAITING' as const, statusLabel: '대기중', nextMatchTime: '오전 11:00 vs 3-1반' },
    { id: '4', name: '정우진', sportWithPosition: '계주 (2번 주자)', status: 'CONFIRMED' as const, statusLabel: '참가 확정', nextMatchTime: '오후 3:20 릴레이' },
    { id: '5', name: '최현우', sportWithPosition: '축구 (후보/교체)', status: 'INJURED_SUB' as const, statusLabel: '발목 경미/대기', nextMatchTime: '벤치 대기' }
  ]);

  // -------------------------------------------------------------
  // Staff & Council State
  // -------------------------------------------------------------
  const [staffSupplies, setStaffSupplies] = useState<SupplyItem[]>([
    { id: 'sup-1', name: '진행요원 디지털 무전기', category: 'radios', currentQty: 18, totalQty: 20, unit: '대', statusText: '2대 충전중' },
    { id: 'sup-2', name: '공인 매치 축구공 (FIFA 공인구)', category: 'balls', currentQty: 12, totalQty: 12, unit: '개', statusText: '기압 점검 완료' },
    { id: 'sup-3', name: '생수 500ml 팩', category: 'water', currentQty: 340, totalQty: 600, unit: '병', statusText: '오후 1시 추가 보충' },
    { id: 'sup-4', name: '심판용 전자 호각 및 플래그', category: 'general', currentQty: 8, totalQty: 8, unit: '세트', statusText: '배부 완료' }
  ]);

  const [fieldIssues, setFieldIssues] = useState<FieldIncidentItem[]>([
    { id: 'iss-1', location: '대운동장 A코트', issueDescription: '잔디 라인 스프레이 비산으로 재도색 완료', reportedAgo: '15분 전', status: 'RESOLVED', statusLabel: '조치 완료' },
    { id: 'iss-2', location: '본관 1층 체육관', issueDescription: '농구 골대 네트 텐션 조정 필요', reportedAgo: '3분 전', status: 'DISPATCHED', statusLabel: '진행요원 이동중' }
  ]);

  // -------------------------------------------------------------
  // Referee State
  // -------------------------------------------------------------
  const [selectedRefereeMatchId, setSelectedRefereeMatchId] = useState<string>(
    matches.find(m => m.status === 'LIVE')?.id || matches[0]?.id || ''
  );
  const activeRefereeMatch = matches.find(m => m.id === selectedRefereeMatchId);

  const [refereeSubstitutions, setRefereeSubstitutions] = useState<SubstitutionRecord[]>([
    { id: 'sub-1', minute: 14, teamLabel: '3-2반', outPlayer: '최현우 (FW)', inPlayer: '강동원 (MF)' }
  ]);

  // -------------------------------------------------------------
  // Medical State
  // -------------------------------------------------------------
  const [medicalQueue, setMedicalQueue] = useState<MedicalIncidentQueueItem[]>([
    {
      id: 'med-1',
      severity: 'MODERATE',
      severityLabel: 'MODERATE (염좌·타박)',
      patientName: '정우진',
      patientClass: '2학년 3반',
      description: '농구 리바운드 착지 시 우측 발목 염좌 (아이싱 처리 중)',
      location: '본관 체육관 의무부스',
      assignedStaff: '보건교사 & 3학년 보건요원',
      reportedAgo: '8분 전',
      reportedTime: '11:22',
      status: 'IN_TREATMENT'
    },
    {
      id: 'med-2',
      severity: 'MILD',
      severityLabel: 'MILD (경미 찰과상)',
      patientName: '이지훈',
      patientClass: '1학년 5반',
      description: '트랙 달리기 중 무릎 찰과상 소독 및 밴드 부착 완료',
      location: '중앙스탠드 1호 의무함',
      assignedStaff: '진행요원',
      reportedAgo: '20분 전',
      reportedTime: '11:10',
      status: 'RESOLVED'
    }
  ]);

  const medicalTimeline: MedicalTimelineItem[] = [
    { id: 't-1', time: '11:22', activity: '정우진 학생 발목 염좌 의무부스 접수 및 냉찜질(아이싱) 1차 개시' },
    { id: 't-2', time: '11:25', activity: '보건교사 문진 실시 (체중 부하 시 통증 경미, 단순 인대 늘어남 진단)' },
    { id: 't-3', time: '11:28', activity: '압박 붕대 고정 및 안정 조치, 학급 담임교사에게 상황 전달 완료' }
  ];

  const hospitalTransfers: HospitalTransferItem[] = [];

  // Handlers for Referee
  const handleScoreUpdate = async (team: 'home' | 'away', delta: number) => {
    if (!activeRefereeMatch) return;
    const currentScore = team === 'home' ? activeRefereeMatch.homeScore : activeRefereeMatch.awayScore;
    const newScore = Math.max(0, currentScore + delta);

    try {
      await updateScoreWithAudit(
        activeRefereeMatch,
        team === 'home' ? newScore : activeRefereeMatch.homeScore,
        team === 'away' ? newScore : activeRefereeMatch.awayScore,
        '공식 심판진 실시간 점수 입력',
        {
          id: currentUser?.studentId || 'ref-01',
          name: currentUser?.name || '공식 심판원',
          role: 'referee'
        }
      );
      showToast(`${activeRefereeMatch.title} ${team === 'home' ? '홈' : '원정'} 점수가 ${newScore}점으로 갱신되었습니다.`);
    } catch (e) {
      console.error(e);
      showToast('점수 갱신 중 오류가 발생했습니다.');
    }
  };

  const handleToggleMatchTimer = async () => {
    if (!activeRefereeMatch) return;
    const nextTimer = !activeRefereeMatch.timerRunning;
    try {
      await updateMatch(activeRefereeMatch.id, {
        timerRunning: nextTimer,
        status: nextTimer ? 'LIVE' : activeRefereeMatch.status === 'SCHEDULED' ? 'LIVE' : activeRefereeMatch.status
      });
      showToast(nextTimer ? '경기 타이머가 시작되었습니다.' : '경기 타이머가 일시정지되었습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndMatch = async () => {
    if (!activeRefereeMatch) return;
    try {
      await updateMatch(activeRefereeMatch.id, {
        status: 'FINISHED',
        timerRunning: false,
        period: '경기 종료'
      });
      showToast(`${activeRefereeMatch.title} 경기가 종료 처리되었습니다.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitMatchApproval = async () => {
    if (!activeRefereeMatch) return;
    try {
      await submitScoreApprovalRequest({
        matchId: activeRefereeMatch.id,
        sport: activeRefereeMatch.sport,
        title: activeRefereeMatch.title,
        homeTeam: activeRefereeMatch.homeTeam,
        homeScore: activeRefereeMatch.homeScore,
        awayTeam: activeRefereeMatch.awayTeam,
        awayScore: activeRefereeMatch.awayScore,
        reporterName: currentUser?.name || '공식 심판원',
        reporterRole: 'referee',
        notes: `정규 시간 종료 및 최종 스코어 (${activeRefereeMatch.homeScore}:${activeRefereeMatch.awayScore}) 공식 승인 요청`
      });
      showToast('경기 결과가 총괄본부(어드민) 승인 대기열로 안전하게 제출되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('승인 요청 제출 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="홈으로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              SPECIALIZED ROLES
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              역할별 전용 운영 대시보드
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-7">
            상산고 체육대회 현장 직무(반장, 학생회 진행요원, 심판원, 의무실)별 전용 관제 시스템입니다.
          </p>
        </div>

        {/* Current user badge */}
        {currentUser && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <UserCheck className="w-4 h-4 text-red-600" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              인증 사용자: <strong>{currentUser.name}</strong> ({currentUser.studentId})
            </span>
          </div>
        )}
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'class_president', label: '반장 / 학급대표', icon: Users, desc: '출전 명단 & 학급 공지' },
          { key: 'student_council', label: '학생회 / 진행요원', icon: ShieldCheck, desc: '장비·물품 & 현장 특이사항' },
          { key: 'referee', label: '공인 심판 / 기록원', icon: Activity, desc: '실시간 점수판 & 교체' },
          { key: 'health_officer', label: '의무실 / 보건요원', icon: Stethoscope, desc: '환자 트리아지 & 핫라인' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoleTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveRoleTab(tab.key as any)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className={`text-[10px] font-normal ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                  {tab.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 1. CLASS PRESIDENT DASHBOARD (4 Cards) */}
      {activeRoleTab === 'class_president' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Scope Notice & Special Actions */}
            <div className="lg:col-span-5 space-y-5">
              <ClassScopeNoticeCard
                allowedScopeText={`${userClassLabel} 전용 스코프`}
                totalPoints={145}
                currentRank={3}
                registeredPlayersCount={classRoster.length}
                unassignedSubstitutesCount={1}
              />
              <ClassLeaderSpecialActionsCard
                onRequestCheers={() => showToast('우리 반 응원단 대단결 요청이 스마트보드에 전송되었습니다!')}
                onCallAttendance={() => showToast('학급 단체방에 선수 집합 소집 알림이 발송되었습니다.')}
                onSendClassNotice={() => showToast('우리 반 선수들에게 경기 준비 쪽지가 발송되었습니다.')}
              />
            </div>

            {/* Right: Roster Management & Schedules */}
            <div className="lg:col-span-7 space-y-5">
              <ClassRosterManagerCard
                roster={classRoster}
                onRegisterNew={() => showToast('새로운 출전 선수 등록 창이 열렸습니다.')}
                onEditPlayer={(pId) => showToast(`선수 #${pId} 포지션 수정이 저장되었습니다.`)}
              />
              <ClassScheduleInquiryCard
                urgentNotice={notices.find(n => n.important) || null}
                classSchedules={classMatches}
                onSubmitInquiry={(txt) => {
                  showToast('대회 운영본부로 학급 문의사항이 성공적으로 전달되었습니다.');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT COUNCIL & STAFF DASHBOARD (4 Cards) */}
      {activeRoleTab === 'student_council' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Quick Controls & Inventory */}
            <div className="lg:col-span-5 space-y-5">
              <StaffQuickControlCard
                onCheckFieldAssignments={() => showToast('대운동장 및 본관 체육관 심판 배치가 전원 완료되었습니다.')}
                onManageStaffVolunteers={() => showToast('전체 진행요원 24명 출석 및 무전 채널 점검이 완료되었습니다.')}
                onCheckConsumables={() => showToast('생수 및 경기 소모품 보충 리스트를 갱신했습니다.')}
              />
              <StaffInventoryCard
                items={staffSupplies}
                onAddItem={() => showToast('신규 비품 등록 모달이 활성화되었습니다.')}
              />
            </div>

            {/* Right: Pending Results Queue & Field Issues */}
            <div className="lg:col-span-7 space-y-5">
              <StaffPendingResultsCard
                pendingRequests={[]}
                staffCount={24}
                standbyCount={8}
                zonesCount={6}
              />
              <StaffFieldIssuesCard
                issues={fieldIssues}
                onBroadcastNotice={async (msg) => {
                  await createNotice({
                    title: '📢 [진행본부 현장 공지]',
                    content: msg,
                    authorName: currentUser?.name || '학생회 진행요원',
                    authorRole: 'student_council',
                    authorId: currentUser?.studentId || 'staff',
                    important: false,
                    type: 'global'
                  });
                  showToast('현장 공지 방송이 전교생 화면에 등록되었습니다.');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. REFEREE DASHBOARD (4 Cards) */}
      {activeRoleTab === 'referee' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Assigned Matches & Queue */}
            <div className="lg:col-span-5 space-y-5">
              <RefereeAssignedMatchesCard
                assignedMatches={matches.map(m => ({
                  id: m.id,
                  title: m.title,
                  sport: m.sport,
                  time: m.startTime ? formatKSTTime(m.startTime) : '14:00',
                  court: m.court || '대운동장 A',
                  isCompleted: m.status === 'FINISHED',
                  statusLabel: m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '배정 대기'
                }))}
                selectedMatchId={selectedRefereeMatchId}
                onSelectMatch={(id) => setSelectedRefereeMatchId(id)}
                storageUsageMb={12}
                storageLimitMb={50}
              />
              <RefereeSubmissionQueueCard
                queueItems={[]}
                onSubmitCurrentMatchScore={handleSubmitMatchApproval}
              />
            </div>

            {/* Right: Realtime Scoreboard & Substitutions */}
            <div className="lg:col-span-7 space-y-5">
              <RefereeScoreboardCard
                match={activeRefereeMatch || null}
                onUpdateScore={handleScoreUpdate}
                onToggleTimer={handleToggleMatchTimer}
                onEndMatch={handleEndMatch}
              />
              <RefereeSubstitutionsCard
                substitutions={refereeSubstitutions}
                initialMemo="경고 및 선수 상태 특이사항 없음"
                onSaveMemo={() => showToast('심판 메모가 안전하게 저장되었습니다.')}
                onAddSubstitution={() => {
                  setRefereeSubstitutions(prev => [
                    ...prev,
                    { id: `sub-${Date.now()}`, minute: 18, teamLabel: '3-1반', outPlayer: '이민준 (MF)', inPlayer: '박서진 (FW)' }
                  ]);
                  showToast('새로운 선수 교체 기록이 추가되었습니다.');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MEDICAL & FIRST AID DASHBOARD (4 Cards) */}
      {activeRoleTab === 'health_officer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Hotline & Field Environmental Indicators */}
            <div className="lg:col-span-5 space-y-5">
              <MedicalEmergencyHotlineCard
                hotlines={[
                  { label: '119 안전신고센터', number: '119' },
                  { label: '상산고 본관 보건실 (내선 104)', number: '063-239-5104' },
                  { label: '전북대학교병원 응급의료센터', number: '063-250-1119' },
                  { label: '총괄본부 의무담당 무전 채널', number: 'CH-07' }
                ]}
                transfers={hospitalTransfers}
              />
              <MedicalSuppliesCard
                risks={[
                  { venue: '대운동장 A코트', sport: '축구', details: '오후 기온 26도, 인조잔디 열기 및 탈수 주의', statusTag: '수분 섭취 권장', isWarning: true },
                  { venue: '본관 체육관 B코트', sport: '농구', details: '실내 환기 정상, 마루바닥 미끄럼 방지 점검 완료', statusTag: '상태 양호', isWarning: false }
                ]}
                supplies={[
                  { id: 'm-1', name: '일회용 급속 냉각팩 (아이스팩)', category: 'medical', currentQty: 48, totalQty: 60, unit: '개' },
                  { id: 'm-2', name: '멸균 탄력 압박붕대 (5cm/10cm)', category: 'medical', currentQty: 25, totalQty: 30, unit: '롤' },
                  { id: 'm-3', name: '생리식염수 및 포비돈 소독액', category: 'medical', currentQty: 10, totalQty: 10, unit: '병' }
                ]}
              />
            </div>

            {/* Right: Triage Queue & Timeline */}
            <div className="lg:col-span-7 space-y-5">
              <MedicalTriageQueueCard
                queue={medicalQueue}
                unconfirmedCount={1}
                onTransferHospital={(id) => showToast(`환자 #${id} 병원 후송 절차가 가동되었습니다.`)}
                onResolveIncident={(id) => {
                  setMedicalQueue(prev => prev.map(m => m.id === id ? { ...m, status: 'RESOLVED' } : m));
                  showToast('환자 치료 완료 상태로 변경되었습니다.');
                }}
              />
              <MedicalPatientTimelineCard
                patientHeader="정우진 학생 (2-3) 응급처치 경과 타임라인"
                timeline={medicalTimeline}
                onWriteOfficialReport={() => showToast('공식 부상 및 구호 일지 작성이 완료되었습니다.')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
