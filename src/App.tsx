import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  UserRole, 
  MatchItem, 
  NoticeItem, 
  FestivalConfig, 
  SportType,
  CheerMessageItem,
  ClassStandingItem,
  AuditLogEntry,
  SuggestionItem
} from './types';
import { 
  Navbar, 
  MainNavTab, 
  NoticeTickerBanner, 
  Footer,
  AuthModal,
  DirectMessageModal,
  SuggestionModal,
  InjuryEncyclopediaModal,
  SoccerFormationBuilder,
  AdminDashboardModal,
  TournamentBracketView,
  LiveMatchStatusView,
  StandingsView,
  LiveMatchHeroCard,
  TodayScheduleCard,
  LiveCheersFeedCard,
  ClassLeaderboardCard,
  SafetyGuideCard,
  TournamentSummaryCard,
  // Role Dashboard cards
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
  MedicalPatientTimelineCard,
  AdminEmergencyControlCard,
  AdminSystemStatusCard,
  AdminScoreApprovalCard,
  AdminAuditLogCard,
  AdminQuickActionsCard,
  AdminInquiryListCard
} from './components';
import { 
  listenMatches, 
  listenNotices, 
  listenFestivalConfig, 
  listenUserReminders, 
  setMatchReminder, 
  removeMatchReminder,
  listenCheersFeed,
  sendCheerMessage,
  sendCheer,
  listenAuditLogs,
  listenSuggestions,
  submitSuggestion,
  answerSuggestion
} from './services/firebaseService';
import { parseStudentId } from './utils/studentIdParser';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

export default function App() {
  // 1. Current User state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sangsan_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser?.role || 'student';
  });

  // 2. Navigation & UI state
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  // 3. Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [showAdminConsoleModal, setShowAdminConsoleModal] = useState(false);
  const [showFormationBuilder, setShowFormationBuilder] = useState(false);

  // 4. Live Data from Firestore
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [cheersFeed, setCheersFeed] = useState<CheerMessageItem[]>([]);
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig | null>(null);
  const [userReminders, setUserReminders] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [inquiries, setInquiries] = useState<SuggestionItem[]>([]);
  const [emergencyLock, setEmergencyLock] = useState<boolean>(false);

  // 5. Active selected match for live view & bracket sport
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [activeMatchForLive, setActiveMatchForLive] = useState<MatchItem | null>(null);
  const [isSubmittingCheer, setIsSubmittingCheer] = useState(false);
  const [lastCheerTimestamp, setLastCheerTimestamp] = useState<number>(0);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Keep role in sync with currentUser unless temporarily previewing in dropdown
  useEffect(() => {
    if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser]);

  // Setup Firebase Real-time listeners
  useEffect(() => {
    const unsubMatches = listenMatches((mList) => {
      setMatches(mList);
    });

    const unsubNotices = listenNotices((nList) => {
      setNotices(nList);
    });

    const unsubFestival = listenFestivalConfig((cfg) => {
      setFestivalConfig(cfg);
    });

    const unsubCheers = listenCheersFeed((cList) => {
      setCheersFeed(cList);
    });

    const unsubAudit = listenAuditLogs((aList) => {
      setAuditLogs(aList);
    });

    const unsubInquiries = listenSuggestions((iList) => {
      setInquiries(iList);
    });

    return () => {
      unsubMatches();
      unsubNotices();
      unsubFestival();
      unsubCheers();
      unsubAudit();
      unsubInquiries();
    };
  }, []);

  // Setup user-specific reminders listener
  useEffect(() => {
    if (!currentUser?.studentId) {
      setUserReminders([]);
      return;
    }
    const unsubReminders = listenUserReminders(currentUser.studentId, (list) => {
      setUserReminders(list.map((r) => r.matchId));
    });
    return () => {
      unsubReminders();
    };
  }, [currentUser?.studentId]);

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('sangsan_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('sangsan_current_user');
    setCurrentUser(null);
    setCurrentRole('student');
  };

  // Toggle 10-minute match reminder
  const handleToggleReminder = async (match: MatchItem) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const isCurrentlySet = userReminders.includes(match.id);
    try {
      if (isCurrentlySet) {
        await removeMatchReminder(currentUser.studentId, match.id);
      } else {
        await setMatchReminder({
          id: `${currentUser.studentId}_${match.id}`,
          matchId: match.id,
          studentId: currentUser.studentId,
          leadMinutes: 10
        });
      }
    } catch (e) {
      console.error('Reminder error:', e);
    }
  };

  // 5-minute Cooldown Rule for Text Cheer Message
  const handleSubmitCheerMessage = async (msg: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    if (now - lastCheerTimestamp < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastCheerTimestamp)) / 60000);
      alert(`응원 메시지는 5분 주기로 1회 작성 가능합니다. (${remainingMinutes}분 후 작성 가능)`);
      return;
    }

    setIsSubmittingCheer(true);
    try {
      // Mask author: e.g. 김*서 (3-2)
      const maskedName = currentUser.name.length > 2 
        ? `${currentUser.name[0]}*${currentUser.name.slice(2)}`
        : `${currentUser.name[0]}*`;
      const authorMasked = `${maskedName} (${currentUser.grade}-${currentUser.classNum})`;

      await sendCheerMessage(
        currentUser.studentId,
        authorMasked,
        `${currentUser.grade}-${currentUser.classNum}`,
        msg
      );
      setLastCheerTimestamp(now);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingCheer(false);
    }
  };

  const sendInquiry = async (role: string, name: string, studentId: string, content: string) => {
    await submitSuggestion({
      authorId: currentUser?.uid || studentId,
      authorName: name,
      authorStudentId: studentId,
      title: `[${studentId}] 현장 문의`,
      content
    });
  };

  const resolveInquiry = async (id: string, answer: string) => {
    await answerSuggestion(id, answer, currentUser?.name || '총괄 관리자');
  };

  const approveScore = async (id: string, operatorId: string, operatorName: string) => {
    console.log('Score approved:', id, operatorId, operatorName);
  };

  const rejectScore = async (id: string, operatorId: string, operatorName: string, reason: string) => {
    console.log('Score rejected:', id, operatorId, operatorName, reason);
  };

  // Currently live match (if any)
  const currentLiveMatch = useMemo(() => {
    if (activeMatchForLive) return activeMatchForLive;
    return matches.find((m) => m.status === 'LIVE') || matches[0] || null;
  }, [matches, activeMatchForLive]);

  // Calculate Standings dynamically from matches data
  const calculatedStandings: ClassStandingItem[] = useMemo(() => {
    const classScores: Record<string, { grade: string; classNum: string; points: number; gold: number; silver: number; bronze: number }> = {};

    matches.forEach((m) => {
      if (m.homeClass) {
        const key = m.homeClass;
        if (!classScores[key]) {
          const parsed = parseStudentId(`${key}01`);
          classScores[key] = { 
            grade: parsed.grade || key.charAt(0), 
            classNum: parsed.classNum || key.slice(1), 
            points: 0, 
            gold: 0, 
            silver: 0, 
            bronze: 0 
          };
        }
      }
      if (m.awayClass) {
        const key = m.awayClass;
        if (!classScores[key]) {
          const parsed = parseStudentId(`${key}01`);
          classScores[key] = { 
            grade: parsed.grade || key.charAt(0), 
            classNum: parsed.classNum || key.slice(1), 
            points: 0, 
            gold: 0, 
            silver: 0, 
            bronze: 0 
          };
        }
      }

      // Add points if match is finished
      if (m.status === 'FINISHED') {
        if (m.homeScore > m.awayScore && m.homeClass) {
          classScores[m.homeClass].points += 100;
          classScores[m.homeClass].gold += 1;
          if (m.awayClass) {
            classScores[m.awayClass].points += 70;
            classScores[m.awayClass].silver += 1;
          }
        } else if (m.awayScore > m.homeScore && m.awayClass) {
          classScores[m.awayClass].points += 100;
          classScores[m.awayClass].gold += 1;
          if (m.homeClass) {
            classScores[m.homeClass].points += 70;
            classScores[m.homeClass].silver += 1;
          }
        } else {
          // Draw or participating score
          if (m.homeClass) classScores[m.homeClass].points += 40;
          if (m.awayClass) classScores[m.awayClass].points += 40;
        }
      }
    });

    const entries = Object.entries(classScores).map(([classId, val]) => ({
      id: classId,
      rank: 1,
      classLabel: `${val.grade}학년 ${val.classNum}반`,
      points: val.points,
      grade: val.grade,
      classNum: val.classNum,
      goldCount: val.gold,
      silverCount: val.silver,
      bronzeCount: val.bronze
    }));

    entries.sort((a, b) => b.points - a.points);
    return entries.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [matches]);

  // Urgent Notice for Ticker
  const activeNotice = notices.find((n) => n.important) || notices[0] || null;

  // Emergency lockdown check
  if (festivalConfig && festivalConfig.isOpen === false && currentRole !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl border border-red-800 bg-red-950/40 space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
          <h1 className="text-xl font-black tracking-tight text-red-200">
            {festivalConfig.name || '상산고등학교 체육대회'} 시스템 비상 잠금
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {festivalConfig.description || '총괄 관리자에 의해 시스템이 일시적으로 잠겼습니다. 안전 점검 또는 대회 점검 중입니다.'}
          </p>
          <div className="pt-4 border-t border-red-900/60 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>관리자 계정으로 로그인</span>
            </button>
          </div>
        </div>
        <Footer />
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRoleChange={setCurrentRole}
        userProfile={currentUser}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMessages={() => {
          if (!currentUser) {
            setShowAuthModal(true);
          } else {
            setShowDirectMessageModal(true);
          }
        }}
        onOpenSuggestions={() => setShowSuggestionModal(true)}
        onOpenInjuries={() => setShowInjuryModal(true)}
        onOpenAdminConsole={() => setShowAdminConsoleModal(true)}
        onLogout={handleLogout}
      />

      {/* 2. Notice Ticker */}
      <NoticeTickerBanner
        notice={activeNotice}
        onClick={() => {
          // Open suggestions or notice info
        }}
      />

      {/* 3. Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Tab 1: Home / Role-specific Dashboard */}
        {activeTab === 'home' && (
          <>
            {currentRole === 'student' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Safety Guide + Today Schedule */}
                <div className="lg:col-span-3 space-y-5">
                  <SafetyGuideCard />
                  <TodayScheduleCard
                    schedules={matches}
                    onViewAll={() => setActiveTab('bracket')}
                    onSelectMatch={(m) => {
                      setActiveMatchForLive(m);
                      setActiveTab('live');
                    }}
                    userReminders={userReminders}
                    onToggleReminder={handleToggleReminder}
                  />
                </div>

                {/* Center Column: Live Match Hero + Tournament Summary */}
                <div className="lg:col-span-5 space-y-5">
                  <LiveMatchHeroCard
                    match={currentLiveMatch}
                    onVoteCheer={() => {
                      if (currentLiveMatch) {
                        sendCheer(currentLiveMatch.id, 'home', '❤️');
                      }
                    }}
                  />
                  <TournamentSummaryCard
                    title="축구 대진표 요약 (남자부)"
                    subtitle="3학년 토너먼트 매치업"
                    selectedSport={selectedSport}
                    onSelectSport={setSelectedSport}
                    availableSports={[
                      { type: 'soccer', label: '축구' },
                      { type: 'basketball', label: '농구' }
                    ]}
                  />
                </div>

                {/* Right Column: Class Leaderboard + Live Cheers */}
                <div className="lg:col-span-4 space-y-5">
                  <ClassLeaderboardCard
                    standings={calculatedStandings}
                    onViewAll={() => setActiveTab('standings')}
                  />
                  <LiveCheersFeedCard
                    cheers={cheersFeed}
                    totalCount={cheersFeed.length > 0 ? cheersFeed.length : 24}
                    onSubmitCheer={handleSubmitCheerMessage}
                    isSubmitting={isSubmittingCheer}
                  />
                </div>
              </div>
            )}

            {currentRole === 'class_president' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl border border-amber-300 dark:border-amber-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-slate-950">
                      CLASS LEADER
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentUser?.classNum ? `${currentUser.grade}학년 ${currentUser.classNum}반` : '3학년 2반'} 전용 채널
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormationBuilder(true)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    축구 포메이션 / 라인업 편성기
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <ClassScopeNoticeCard 
                      allowedScopeText={currentUser?.classNum ? `${currentUser.grade}학년 ${currentUser.classNum}반` : '3학년 2반'} 
                    />
                  </div>

                  {/* Center Column */}
                  <div className="lg:col-span-5 space-y-4">
                    <ClassRosterManagerCard 
                      onRegisterNew={() => setShowFormationBuilder(true)}
                    />
                    <ClassLeaderSpecialActionsCard
                      onRequestCheers={() => {
                        if (currentLiveMatch) {
                          sendCheer(currentLiveMatch.id, 'home', '👏 2반 힘내자!');
                        }
                      }}
                      onCallAttendance={() => {
                        // broadcast notice
                      }}
                      onSendClassNotice={() => {
                        setShowDirectMessageModal(true);
                      }}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-4 space-y-4">
                    <ClassScheduleInquiryCard 
                      urgentNotice={activeNotice}
                      classSchedules={matches}
                      onSubmitInquiry={async (msg) => {
                        await sendInquiry('class_leader', '3학년 2반 반장', '3-2', msg);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentRole === 'student_council' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-amber-600/10 dark:bg-amber-600/5 rounded-2xl border border-amber-400 dark:border-amber-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white">
                      STUDENT COUNCIL
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      대회 현장 운영 & 자원 배치 전용 콘솔
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ 점수 확정 권한 수칙
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        현재 전송된 대기 요청: 3건. 입력된 스코어는 총괄 관리자(Admin) 최종 승인 후 전교 순위에 반영됩니다.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[11px] text-slate-500">운영 스태프</div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">48명</div>
                        <div className="text-[10px] text-slate-400">본부 대기 8명</div>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[11px] text-slate-500">경기장 배정</div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">4개 구역</div>
                        <div className="text-[10px] text-emerald-500">전 구역 운영중</div>
                      </div>
                    </div>

                    <StaffQuickControlCard />
                  </div>

                  {/* Center Column */}
                  <div className="lg:col-span-5 space-y-4">
                    <StaffPendingResultsCard />
                    <StaffFieldIssuesCard />
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-4 space-y-4">
                    <StaffInventoryCard />
                  </div>
                </div>
              </div>
            )}

            {currentRole === 'teacher' && (
              <div className="space-y-4">
                {/* Offline Sync Banner matching Page 7 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-900/60 text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    ● 실시간 로컬 백업 활성화됨 • 오프라인 임시 저장 지원
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                    네트워크 연결 손실 시에도 입력된 스코어와 메모가 브라우저에 캐싱되어 보존됩니다.
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <RefereeAssignedMatchesCard />
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        🚫 비배정 경기 접근 제한
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        타 심판진에게 배정된 경기의 스코어 및 경기 상태 제어 권한이 없습니다. 경기 대진 정보만 뷰어로 조회할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* Center Column */}
                  <div className="lg:col-span-6 space-y-4">
                    <RefereeScoreboardCard />
                    <RefereeSubstitutionsCard />
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <RefereeSubmissionQueueCard />
                  </div>
                </div>
              </div>
            )}

            {currentRole === 'health_officer' && (
              <div className="space-y-4">
                {/* Privacy and Medical Data Protection Banner matching Page 8 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-300 dark:border-amber-800/80 text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    ⚠️ 학생 개인정보 및 의료 민감 데이터 보호 의무 대상 화면
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                    환자 기본 정보 및 보호자 비상 연락처 노출 방지에 유의하세요. 허가받지 않은 모바일 촬영 및 화면 공유는 법적으로 금지됩니다.
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        ⚠️ 경기장별 위험 / 환경 지표
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">대운동장 (축구)</span>
                          <span className="text-red-600 dark:text-red-400 font-bold">탈수 주의 (29.4°C)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">실내 체육관 (농구)</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">최적 (23.1°C)</span>
                        </div>
                      </div>
                    </div>

                    <MedicalSuppliesCard />
                  </div>

                  {/* Center Column */}
                  <div className="lg:col-span-6 space-y-4">
                    <MedicalTriageQueueCard />
                    <MedicalPatientTimelineCard />
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-3 space-y-4">
                    <MedicalEmergencyHotlineCard />
                  </div>
                </div>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="space-y-5">
                {/* Top Row matching Page 4 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <AdminEmergencyControlCard 
                      isEmergencyActive={emergencyLock}
                      onStopAllMatches={() => setEmergencyLock(true)}
                      onResumeAllMatches={() => setEmergencyLock(false)}
                      onSwitchToIndoor={() => {
                        // switch to indoor
                      }}
                    />
                  </div>

                  <div className="md:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      실시간 점수 승인 대기
                    </div>
                    <div className="text-3xl font-black font-mono text-red-600 dark:text-red-400 my-1">
                      2건
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold self-start">
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

                  <div className="md:col-span-4">
                    <AdminAuditLogCard 
                      logs={auditLogs}
                      onViewMore={() => setShowAdminConsoleModal(true)}
                    />
                  </div>
                </div>

                {/* Main section: 2 columns matching Page 4 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-4 space-y-5">
                    <AdminSystemStatusCard 
                      totalMembersCount={1048}
                      unregisteredMembersCount={12}
                      totalMatchesCount={38}
                      completedMatchesCount={24}
                      pendingMatchesCount={14}
                    />
                  </div>
                  <div className="lg:col-span-8 space-y-5">
                    <AdminScoreApprovalCard 
                      onApprove={(id) => {
                        approveScore(id, 'admin-1', '관리자 김태호');
                      }}
                      onReject={(id) => {
                        rejectScore(id, 'admin-1', '관리자 김태호', '판정 재검토');
                      }}
                    />
                    <AdminQuickActionsCard 
                      onOpenCreateMatch={() => setShowAdminConsoleModal(true)}
                      onOpenPushNotice={() => setShowAdminConsoleModal(true)}
                      onOpenUserManagement={() => setShowAdminConsoleModal(true)}
                    />
                    <AdminInquiryListCard 
                      inquiries={inquiries}
                      onResolveInquiry={async (id) => {
                        await resolveInquiry(id, '조치 완료');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Bracket View */}
        {activeTab === 'bracket' && (
          <TournamentBracketView
            matches={matches}
            sport={selectedSport}
            onSelectSport={setSelectedSport}
            userReminders={userReminders}
            onToggleReminder={handleToggleReminder}
            onOpenMatchDetail={(m) => {
              setActiveMatchForLive(m);
              setActiveTab('live');
            }}
          />
        )}

        {/* Tab 3: Live Match View */}
        {activeTab === 'live' && (
          currentLiveMatch ? (
            <LiveMatchStatusView
              currentUser={currentUser || {
                uid: 'guest',
                studentId: '00000',
                name: '게스트 학생',
                role: currentRole,
                grade: '1',
                classNum: '01',
                studentNum: '01',
                gender: 'other',
                isTeacher: false,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              }}
              match={currentLiveMatch}
              onBack={() => setActiveTab('bracket')}
            />
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              현재 선택된 또는 진행 중인 경기가 없습니다.
            </div>
          )
        )}

        {/* Tab 4: Standings View */}
        {activeTab === 'standings' && (
          <StandingsView standings={calculatedStandings as any} />
        )}
      </main>

      {/* 4. Footer with required made by SMARTLAB 김태호 */}
      <Footer customCredit="made by SMARTLAB 김태호" />

      {/* 5. Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showDirectMessageModal && currentUser && (
        <DirectMessageModal
          currentUser={currentUser}
          isOpen={showDirectMessageModal}
          onClose={() => setShowDirectMessageModal(false)}
        />
      )}

      {showSuggestionModal && currentUser && (
        <SuggestionModal
          currentUser={currentUser}
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
        />
      )}

      {showInjuryModal && (
        <InjuryEncyclopediaModal
          currentUser={currentUser || {
            uid: 'guest',
            studentId: '00000',
            name: '게스트',
            role: currentRole,
            grade: '1',
            classNum: '01',
            studentNum: '01',
            gender: 'other',
            isTeacher: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }}
          isOpen={showInjuryModal}
          onClose={() => setShowInjuryModal(false)}
        />
      )}

      {showAdminConsoleModal && currentUser && (
        <AdminDashboardModal
          currentUser={currentUser}
          isOpen={showAdminConsoleModal}
          onClose={() => setShowAdminConsoleModal(false)}
        />
      )}

      {showFormationBuilder && currentUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                축구 출전 포메이션 빌더 (경기 1시간 전 제출)
              </h3>
              <button
                type="button"
                onClick={() => setShowFormationBuilder(false)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                닫기 ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <SoccerFormationBuilder
                classId={currentUser.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '203'}
                matchId={currentLiveMatch?.id || 'm-101'}
                submittedBy={`${currentUser.studentId} ${currentUser.name}`}
                onSaved={() => setShowFormationBuilder(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
