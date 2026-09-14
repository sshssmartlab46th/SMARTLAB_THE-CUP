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
  NoticeModal,
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
  WeatherWidget,
  // Independent pages
  LoginPage,
  SchedulePage,
  PrivacyPage,
  RulesPage,
  AboutSmartlabPage,
  ContactInquiryPage,
  InjuryEncyclopediaPage,
  SuggestionBoxPage,
  SettingsPage,
  FormationInputPage,
  AdminConsolePage,
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
  listenCheersFeed,
  listenAuditLogs,
  listenSuggestions,
  listenUserReminders,
  setMatchReminder,
  removeMatchReminder,
  sendCheerMessage,
  sendLiveReaction,
  updateFestivalConfig,
  answerSuggestion,
  updateMatch,
  updateScoreWithAudit
} from './services/firebaseService';
import { parseStudentId } from './utils/studentIdParser';
import { filterProfanity } from './utils/profanityFilter';
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

  // 2. Navigation & UI state (Independent Pages support)
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

  // 4. Notice Popup State (User request: 공지의 경우 팝업이 떠야 함)
  const [selectedNoticeForPopup, setSelectedNoticeForPopup] = useState<NoticeItem | null>(null);
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false);

  // 5. Live Data from Firestore
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [cheersFeed, setCheersFeed] = useState<CheerMessageItem[]>([]);
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig | null>(null);
  const [userReminders, setUserReminders] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [inquiries, setInquiries] = useState<SuggestionItem[]>([]);
  const [emergencyLock, setEmergencyLock] = useState<boolean>(false);

  // 6. Active selected match for live view & bracket sport
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

  // Popup important notice automatically on initial load if present
  useEffect(() => {
    if (!hasShownInitialPopup && notices.length > 0) {
      const urgent = notices.find(n => n.important);
      if (urgent) {
        setSelectedNoticeForPopup(urgent);
      }
      setHasShownInitialPopup(true);
    }
  }, [notices, hasShownInitialPopup]);

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
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('sangsan_current_user');
    setCurrentUser(null);
    setCurrentRole('student');
    setActiveTab('home');
  };

  // Toggle 10-minute match reminder
  const handleToggleReminder = async (match: MatchItem) => {
    if (!currentUser) {
      setActiveTab('login');
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

  // 5-minute Cooldown Rule for Text Cheer Message with Auto-Profanity Filter
  const handleSubmitCheerMessage = async (msg: string) => {
    if (!currentUser) {
      setActiveTab('login');
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    if (now - lastCheerTimestamp < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastCheerTimestamp)) / 60000);
      alert(`응원 메시지는 5분 주기로 1회 작성 가능합니다. (${remainingMinutes}분 후 작성 가능)`);
      return;
    }

    // Filter profanity automatically
    const filterResult = filterProfanity(msg);

    setIsSubmittingCheer(true);
    try {
      const maskedName = currentUser.name.length > 2 
        ? `${currentUser.name[0]}*${currentUser.name.slice(2)}`
        : `${currentUser.name[0]}*`;
      const authorMasked = `${maskedName} (${currentUser.grade}-${currentUser.classNum})`;

      await sendCheerMessage(
        currentUser.studentId,
        authorMasked,
        `${currentUser.grade}-${currentUser.classNum}`,
        filterResult.filteredText
      );
      setLastCheerTimestamp(now);
    } catch (e) {
      console.error('Cheer submit error:', e);
    } finally {
      setIsSubmittingCheer(false);
    }
  };

  const handleSendReaction = async (reactionType: 'fire' | 'clap' | 'heart' | 'cheer') => {
    try {
      await sendLiveReaction(reactionType);
    } catch (e) {
      console.error('Reaction error:', e);
    }
  };

  // Calculated Standings
  const calculatedStandings = useMemo<ClassStandingItem[]>(() => {
    const classMap: Record<string, { totalPoints: number; wins: number; draws: number; losses: number }> = {};
    const defaultClasses = [
      '101', '102', '103', '104', '105', '106', '107', '108',
      '201', '202', '203', '204', '205', '206', '207', '208',
      '301', '302', '303', '304', '305', '306', '307', '308'
    ];
    defaultClasses.forEach(c => {
      classMap[c] = { totalPoints: 0, wins: 0, draws: 0, losses: 0 };
    });

    matches.forEach(m => {
      if (m.status === 'FINISHED' && m.winnerClass) {
        if (!classMap[m.winnerClass]) {
          classMap[m.winnerClass] = { totalPoints: 0, wins: 0, draws: 0, losses: 0 };
        }
        classMap[m.winnerClass].totalPoints += 300;
        classMap[m.winnerClass].wins += 1;

        const loserClass = m.homeClass === m.winnerClass ? m.awayClass : m.homeClass;
        if (loserClass) {
          if (!classMap[loserClass]) {
            classMap[loserClass] = { totalPoints: 0, wins: 0, draws: 0, losses: 0 };
          }
          classMap[loserClass].losses += 1;
        }
      }
    });

    const items = Object.entries(classMap).map(([cId, stats]) => {
      const grade = cId.charAt(0);
      const classNum = cId.slice(1);
      const parsedNum = parseInt(classNum, 10);
      return {
        id: cId,
        classId: cId,
        className: `${grade}-${parsedNum}반`,
        classLabel: `${grade}-${parsedNum}반`,
        grade,
        classNum: String(parsedNum),
        rank: 1,
        points: stats.totalPoints,
        totalPoints: stats.totalPoints,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        goldCount: stats.wins,
        silverCount: 0,
        bronzeCount: 0
      } as unknown as ClassStandingItem;
    });

    items.sort((a, b) => b.points - a.points);
    items.forEach((it, idx) => {
      it.rank = idx + 1;
    });

    return items;
  }, [matches]);

  // Currently live or next upcoming match
  const currentLiveMatch = useMemo(() => {
    if (activeMatchForLive) return activeMatchForLive;
    const inProgress = matches.find((m) => m.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;
    return matches.find((m) => m.status === 'SCHEDULED') || matches[0] || null;
  }, [matches, activeMatchForLive]);

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
              onClick={() => setActiveTab('login')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>관리자 계정으로 로그인</span>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Footer Navigation links
  const footerLinks = [
    { label: '개인정보처리방침', onClick: () => setActiveTab('privacy') },
    { label: '체육대회 규정집', onClick: () => setActiveTab('rules') },
    { label: '스마트랩 소개', onClick: () => setActiveTab('smartlab') },
    { label: '문의하기', onClick: () => setActiveTab('contact') }
  ];

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
            setActiveTab('login');
          } else {
            setShowDirectMessageModal(true);
          }
        }}
        onOpenSuggestions={() => setActiveTab('suggestions')}
        onOpenInjuries={() => setActiveTab('injury')}
        onOpenAdminConsole={() => setActiveTab('admin')}
        onLogout={handleLogout}
      />

      {/* 2. Notice Ticker with Click-to-Popup */}
      {activeNotice && (
        <NoticeTickerBanner
          notice={activeNotice}
          onClick={() => setSelectedNoticeForPopup(activeNotice)}
        />
      )}

      {/* 3. Main Content Rendering */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* INDEPENDENT PAGES ROUTING */}
        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'schedule' && (
          <SchedulePage
            matches={matches}
            userReminders={userReminders}
            onToggleReminder={handleToggleReminder}
            onSelectMatch={(m) => {
              setActiveMatchForLive(m);
              setActiveTab('live');
            }}
          />
        )}

        {activeTab === 'privacy' && <PrivacyPage />}

        {activeTab === 'rules' && <RulesPage />}

        {activeTab === 'smartlab' && <AboutSmartlabPage />}

        {activeTab === 'contact' && (
          <ContactInquiryPage
            currentUser={currentUser}
            onOpenLogin={() => setActiveTab('login')}
          />
        )}

        {activeTab === 'injury' && <InjuryEncyclopediaPage />}

        {activeTab === 'suggestions' && (
          <SuggestionBoxPage
            currentUser={currentUser}
            suggestions={inquiries}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

        {activeTab === 'formation' && (
          <FormationInputPage
            matches={matches}
            userClass={currentUser?.grade && currentUser?.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '302'}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConsolePage
            matches={matches}
            auditLogs={auditLogs}
            inquiries={inquiries}
            festivalConfig={festivalConfig}
          />
        )}

        {/* BRACKET VIEW */}
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

        {/* LIVE VIEW */}
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

        {/* STANDINGS VIEW */}
        {activeTab === 'standings' && (
          <StandingsView standings={calculatedStandings as any} />
        )}

        {/* HOME DASHBOARD / ROLE DASHBOARDS */}
        {activeTab === 'home' && (
          <>
            {/* Student standard view */}
            {currentRole === 'student' && (
              <div className="space-y-6">
                <WeatherWidget variant="banner" />
                <SafetyGuideCard onOpenInjuryEncyclopedia={() => setActiveTab('injury')} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <LiveMatchHeroCard
                      match={currentLiveMatch}
                      onOpenLiveScore={() => {
                        if (currentLiveMatch) {
                          setActiveMatchForLive(currentLiveMatch);
                          setActiveTab('live');
                        }
                      }}
                      onCheerReaction={handleSendReaction}
                      onToggleReminder={handleToggleReminder}
                      isReminderSet={currentLiveMatch ? userReminders.includes(currentLiveMatch.id) : false}
                    />

                    <TodayScheduleCard
                      matches={matches}
                      userReminders={userReminders}
                      onToggleReminder={handleToggleReminder}
                      onSelectMatch={(m) => {
                        setActiveMatchForLive(m);
                        setActiveTab('live');
                      }}
                    />

                    <TournamentSummaryCard
                      matches={matches}
                      onOpenFullBracket={() => setActiveTab('bracket')}
                    />
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <ClassLeaderboardCard
                      standings={calculatedStandings as any}
                      onOpenFullStandings={() => setActiveTab('standings')}
                    />

                    <LiveCheersFeedCard
                      cheers={cheersFeed}
                      isSubmitting={isSubmittingCheer}
                      onSubmitCheer={handleSubmitCheerMessage}
                      disabledNotice={!currentUser ? '학번 로그인이 필요합니다' : undefined}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Class Leader Role Dashboard */}
            {currentRole === 'class_president' && (
              <div className="space-y-6">
                <ClassScopeNoticeCard
                  classId={currentUser?.grade && currentUser?.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '302'}
                  notices={notices}
                />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <ClassRosterManagerCard
                      classId={currentUser?.grade && currentUser?.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '302'}
                    />
                    <ClassScheduleInquiryCard
                      classId={currentUser?.grade && currentUser?.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '302'}
                      matches={matches}
                    />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <ClassLeaderSpecialActionsCard
                      onOpenFormationBuilder={() => setActiveTab('formation')}
                      onEmergencyMessage={() => setShowDirectMessageModal(true)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Student Council & Staff Role Dashboard */}
            {currentRole === 'student_council' && (
              <div className="space-y-6">
                <StaffQuickControlCard
                  onOpenNoticeComposer={() => setSelectedNoticeForPopup(notices[0] || null)}
                  onOpenBracketModifier={() => setActiveTab('admin')}
                />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <StaffPendingResultsCard
                      matches={matches.filter(m => m.status === 'IN_PROGRESS')}
                      onConfirmScore={(matchId) => {
                        updateMatch(matchId, { status: 'FINISHED', period: '경기종료' });
                      }}
                    />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <StaffInventoryCard />
                    <StaffFieldIssuesCard />
                  </div>
                </div>
              </div>
            )}

            {/* Teacher & Referee Role Dashboard */}
            {currentRole === 'teacher' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <RefereeScoreboardCard
                      match={currentLiveMatch}
                      onUpdateScore={(team, delta) => {
                        if (!currentLiveMatch) return;
                        const newHome = team === 'home' ? Math.max(0, currentLiveMatch.homeScore + delta) : currentLiveMatch.homeScore;
                        const newAway = team === 'away' ? Math.max(0, currentLiveMatch.awayScore + delta) : currentLiveMatch.awayScore;
                        updateScoreWithAudit(
                          currentLiveMatch,
                          newHome,
                          newAway,
                          '심판 점수 입력',
                          { id: currentUser?.uid || 'teacher', name: currentUser?.name || '심판교사', role: 'teacher' }
                        );
                      }}
                      onToggleTimer={() => {
                        if (!currentLiveMatch) return;
                        updateMatch(currentLiveMatch.id, { timerRunning: !currentLiveMatch.timerRunning });
                      }}
                      onEndMatch={() => {
                        if (!currentLiveMatch) return;
                        updateMatch(currentLiveMatch.id, { status: 'FINISHED', period: '경기종료' });
                      }}
                    />
                    <RefereeSubstitutionsCard match={currentLiveMatch} />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <RefereeAssignedMatchesCard
                      matches={matches}
                      selectedMatchId={currentLiveMatch?.id}
                      onSelectMatch={(m) => setActiveMatchForLive(m)}
                    />
                    <RefereeSubmissionQueueCard />
                  </div>
                </div>
              </div>
            )}

            {/* Safety & Medical Officer Role Dashboard */}
            {currentRole === 'health_officer' && (
              <div className="space-y-6">
                <MedicalEmergencyHotlineCard />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <MedicalTriageQueueCard onOpenEncyclopedia={() => setActiveTab('injury')} />
                    <MedicalPatientTimelineCard />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <MedicalSuppliesCard />
                  </div>
                </div>
              </div>
            )}

            {/* Administrator Role Dashboard */}
            {currentRole === 'admin' && (
              <AdminConsolePage
                matches={matches}
                auditLogs={auditLogs}
                inquiries={inquiries}
                festivalConfig={festivalConfig}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Footer with required made by SMARTLAB 김태호 */}
      <Footer links={footerLinks} customCredit="made by SMARTLAB 김태호" />

      {/* 5. Notice Popup Modal (User request: 공지의 경우 팝업이 떠야 함) */}
      {selectedNoticeForPopup && (
        <NoticeModal
          notice={selectedNoticeForPopup}
          onClose={() => setSelectedNoticeForPopup(null)}
        />
      )}

      {/* 6. Direct Message Modal */}
      {showDirectMessageModal && currentUser && (
        <DirectMessageModal
          currentUser={currentUser}
          isOpen={showDirectMessageModal}
          onClose={() => setShowDirectMessageModal(false)}
        />
      )}
    </div>
  );
}
