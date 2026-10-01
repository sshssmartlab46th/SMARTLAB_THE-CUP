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
  MobileBottomNav,
  MobileMenuDrawer,
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
  WeatherAtmosphereOverlay,
  // Independent pages
  LoginPage,
  SchedulePage,
  MatchSchedulePage,
  PrivacyPage,
  RulesPage,
  AboutSmartlabPage,
  ContactInquiryPage,
  InjuryEncyclopediaPage,
  SuggestionBoxPage,
  SettingsPage,
  FormationInputPage,
  AdminConsolePage,
  RoleDashboardPage,
  MessagesPage,
  WeatherDetailPage,
  NoticesPage,
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
  setBulkMatchReminders,
  removeBulkMatchReminders,
  sendCheerMessage,
  sendLiveReaction,
  updateFestivalConfig,
  answerSuggestion,
  updateMatch,
  updateScoreWithAudit,
  autoStartDueMatches,
  syncCompletedTournamentRounds,
  startMatch,
  seedInitialDataIfEmpty
} from './services/firebaseService';
import { parseStudentId } from './utils/studentIdParser';
import { filterProfanity } from './utils/profanityFilter';
import { getKSTNowParts } from './utils/kstTime';
import { useOpenMeteoWeather } from './hooks/useOpenMeteoWeather';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { registerServiceWorker, checkAndTrigger15MinMatchNotifications } from './services/notificationService';

export default function App() {
  // Real-time Weather & Atmospheric Visual Effects
  const { weather, refreshing: weatherRefreshing, refetch: refetchWeather } = useOpenMeteoWeather({
    refreshIntervalMs: 60000
  });

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

  // 2. Navigation & UI state: Show login page by default on first entry
  const [activeTab, setActiveTabState] = useState<MainNavTab>(() => {
    try {
      const saved = localStorage.getItem('sangsan_current_user');
      return saved ? 'home' : 'login';
    } catch {
      return 'login';
    }
  });

  const protectedTabs = useMemo<Set<MainNavTab>>(() => new Set([
    'home',
    'notices',
    'bracket',
    'live',
    'standings',
    'schedule',
    'injury',
    'suggestions',
    'messages',
    'settings',
    'formation',
    'admin',
    'roledashboard',
    'weather',
    'contact'
  ]), []);

  const navigateTo = (tab: MainNavTab) => {
    if (!currentUser && protectedTabs.has(tab)) {
      setActiveTabState('login');
      return;
    }
    setActiveTabState(tab);
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('sangsan_theme');
      if (savedTheme) return savedTheme === 'dark';
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sangsan_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  // 3. Modals state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Never leave a protected dashboard route active after logout or session expiry.
  useEffect(() => {
    if (!currentUser && protectedTabs.has(activeTab)) {
      setActiveTabState('login');
    }
  }, [activeTab, currentUser, protectedTabs]);

  // Setup Firebase Real-time listeners & seed initial brackets if empty
  useEffect(() => {
    seedInitialDataIfEmpty().catch(console.error);

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

  // Automatically transition scheduled matches whose scheduled start time has arrived to 'LIVE'
  useEffect(() => {
    if (matches.length === 0) return;

    const triggerAutoStart = async () => {
      try {
        const started = await autoStartDueMatches(matches);
        if (started.length > 0) {
          console.log(`[AutoStart] Started ${started.length} due match(es):`, started.map(m => m.title));
        }
      } catch (e) {
        console.error('[AutoStart] error:', e);
      }
    };

    // Run check upon matches receipt
    triggerAutoStart();

    // Check periodically every 15 seconds
    const interval = setInterval(triggerAutoStart, 15000);
    return () => clearInterval(interval);
  }, [matches]);

  // Reactive Tournament Round Auto-Advancement Sync
  // Automatically advances winners to next round when all matches in an n-gang round are finished across all sports
  useEffect(() => {
    if (matches.length === 0) return;

    let isCancelled = false;
    const checkTournamentRounds = async () => {
      try {
        const res = await syncCompletedTournamentRounds(matches);
        if (!isCancelled && res.updatedCount > 0) {
          console.log(`[Tournament Auto-Advance] ${res.updatedCount} match(es) auto-advanced:`, res.logs);
        }
      } catch (e) {
        console.warn('[Tournament Auto-Advance] Check warning:', e);
      }
    };

    // Debounce to allow batches to settle
    const debounceTimer = setTimeout(checkTournamentRounds, 800);
    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [matches]);

  // Popup: strictly the single most recent notice automatically on initial load if present and not dismissed today
  // (User mandate: "팝업에는 가장 최근 공지만 ㄱㄱ")
  useEffect(() => {
    if (!hasShownInitialPopup && notices.length > 0) {
      try {
        const { dateStr } = getKSTNowParts();
        const hideDate = localStorage.getItem('sangsan_hide_notice_date');
        if (hideDate !== dateStr) {
          // Strictly the most recent notice (notices[0], as notices are sorted by createdAt descending)
          const mostRecentNotice = notices[0];
          if (mostRecentNotice) {
            setSelectedNoticeForPopup(mostRecentNotice);
          }
        }
      } catch (e) {
        console.error('Failed checking notice dismissal date', e);
      }
      setHasShownInitialPopup(true);
    }
  }, [notices, hasShownInitialPopup]);

  // Service Worker registration & 15-minute pre-match notification checking
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      checkAndTrigger15MinMatchNotifications(matches, userReminders);
    }
    const interval = setInterval(() => {
      if (matches.length > 0) {
        checkAndTrigger15MinMatchNotifications(matches, userReminders);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [matches, userReminders]);

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
    setActiveTabState('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('sangsan_current_user');
    setCurrentUser(null);
    setCurrentRole('student');
    setActiveTabState('login');
  };

  // Toggle 10-minute match reminder
  const handleToggleReminder = async (match: MatchItem) => {
    if (!currentUser) {
      navigateTo('login');
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

  // Bulk Toggle all today's match reminders for authenticated user
  const handleToggleAllTodayReminders = async (matchesToToggle: MatchItem[], enable: boolean) => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }
    const matchIds = matchesToToggle.map((m) => m.id);
    if (matchIds.length === 0) return;

    try {
      if (enable) {
        setUserReminders((prev) => Array.from(new Set([...prev, ...matchIds])));
        await setBulkMatchReminders(currentUser.studentId, matchIds, 10);
      } else {
        setUserReminders((prev) => prev.filter((id) => !matchIds.includes(id)));
        await removeBulkMatchReminders(currentUser.studentId, matchIds);
      }
    } catch (e) {
      console.error('Bulk reminders error:', e);
    }
  };

  // 5-minute Cooldown Rule for Text Cheer Message with Auto-Profanity Filter
  const handleSubmitCheerMessage = async (msg: string) => {
    if (!currentUser) {
      navigateTo('login');
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

  // Calculated Standings (36 classes: 12 classes * 3 grades)
  const calculatedStandings = useMemo<ClassStandingItem[]>(() => {
    if (matches.length === 0) {
      return [];
    }

    const classMap: Record<string, { totalPoints: number; wins: number; draws: number; losses: number; gold: number; silver: number }> = {};
    
    // Sangsan High School 12 classes per grade (101~112, 201~212, 301~312)
    for (let g = 1; g <= 3; g++) {
      for (let c = 1; c <= 12; c++) {
        const classCode = `${g}${String(c).padStart(2, '0')}`;
        classMap[classCode] = { totalPoints: 0, wins: 0, draws: 0, losses: 0, gold: 0, silver: 0 };
      }
    }

    // Load custom points config if saved by admin
    let pointsConfigMap: Record<string, { champion: number; runnerUp: number; winPerMatch: number; drawPerMatch: number; participation: number }> = {};
    try {
      const savedConfig = localStorage.getItem('sangsan_sport_points_config');
      if (savedConfig) {
        const parsedList = JSON.parse(savedConfig);
        parsedList.forEach((cfg: any) => {
          pointsConfigMap[cfg.sport] = cfg;
        });
      }
    } catch {
      // fallback
    }

    matches.forEach(m => {
      const sportCfg = pointsConfigMap[m.sport] || {
        champion: 500,
        runnerUp: 300,
        winPerMatch: 100,
        drawPerMatch: 50,
        participation: 50
      };

      // Add participation points if match is scheduled or finished
      if (m.homeClass && classMap[m.homeClass]) {
        classMap[m.homeClass].totalPoints += sportCfg.participation || 0;
      }
      if (m.awayClass && classMap[m.awayClass]) {
        classMap[m.awayClass].totalPoints += sportCfg.participation || 0;
      }

      if (m.status === 'FINISHED') {
        const isFinal = m.round?.includes('결승') || m.title?.includes('결승');
        if (m.homeScore > m.awayScore) {
          if (m.homeClass && classMap[m.homeClass]) {
            classMap[m.homeClass].wins += 1;
            classMap[m.homeClass].totalPoints += isFinal ? sportCfg.champion : sportCfg.winPerMatch;
            if (isFinal) classMap[m.homeClass].gold += 1;
          }
          if (m.awayClass && classMap[m.awayClass]) {
            classMap[m.awayClass].losses += 1;
            if (isFinal) {
              classMap[m.awayClass].totalPoints += sportCfg.runnerUp;
              classMap[m.awayClass].silver += 1;
            }
          }
        } else if (m.awayScore > m.homeScore) {
          if (m.awayClass && classMap[m.awayClass]) {
            classMap[m.awayClass].wins += 1;
            classMap[m.awayClass].totalPoints += isFinal ? sportCfg.champion : sportCfg.winPerMatch;
            if (isFinal) classMap[m.awayClass].gold += 1;
          }
          if (m.homeClass && classMap[m.homeClass]) {
            classMap[m.homeClass].losses += 1;
            if (isFinal) {
              classMap[m.homeClass].totalPoints += sportCfg.runnerUp;
              classMap[m.homeClass].silver += 1;
            }
          }
        } else {
          // Draw
          if (m.homeClass && classMap[m.homeClass]) {
            classMap[m.homeClass].draws += 1;
            classMap[m.homeClass].totalPoints += sportCfg.drawPerMatch;
          }
          if (m.awayClass && classMap[m.awayClass]) {
            classMap[m.awayClass].draws += 1;
            classMap[m.awayClass].totalPoints += sportCfg.drawPerMatch;
          }
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
        goldCount: stats.gold,
        silverCount: stats.silver,
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
    const inProgress = matches.find((m) => m.status === 'LIVE' || m.status === 'PAUSED');
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
              onClick={() => navigateTo('login')}
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
    { label: '공지사항 전체보기', onClick: () => navigateTo('notices') },
    { label: '개인정보처리방침', onClick: () => navigateTo('privacy') },
    { label: '체육대회 규정집', onClick: () => navigateTo('rules') },
    { label: '스마트랩 소개', onClick: () => navigateTo('smartlab') },
    { label: '문의하기', onClick: () => navigateTo('contact') }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Site-Wide Atmospheric Weather Overlay (Active only on Weather Tab) */}
      <WeatherAtmosphereOverlay
        weather={weather}
        enabled={activeTab === 'weather'}
      />

      {/* 1. Global Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={navigateTo}
        onRoleChange={setCurrentRole}
        userProfile={currentUser}
        weather={weather}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenMessages={() => {
          if (!currentUser) {
            navigateTo('login');
          } else {
            navigateTo('messages');
          }
        }}
        onOpenSuggestions={() => navigateTo('suggestions')}
        onOpenInjuries={() => navigateTo('injury')}
        onOpenAdminConsole={() => navigateTo('admin')}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-6">
        {/* INDEPENDENT PAGES ROUTING */}
        {activeTab === 'login' && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onCancel={currentUser ? () => navigateTo('home') : undefined}
          />
        )}

        {activeTab === 'notices' && (
          <NoticesPage
            notices={notices}
            currentUser={currentUser}
            onOpenPopup={(n) => setSelectedNoticeForPopup(n)}
          />
        )}

        {/* COMBINED MATCH SCHEDULE & BRACKET VIEW */}
        {(activeTab === 'schedule' || activeTab === 'bracket') && (
          <MatchSchedulePage
            matches={matches}
            sport={selectedSport}
            onSelectSport={setSelectedSport}
            userReminders={userReminders}
            onToggleReminder={handleToggleReminder}
            onOpenMatchDetail={(m) => {
              setActiveMatchForLive(m);
              navigateTo('live');
            }}
            onSelectMatch={(m) => {
              setActiveMatchForLive(m);
              navigateTo('live');
            }}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyPage 
            currentUser={currentUser} 
            onNavigateToAdmin={() => navigateTo('admin')} 
          />
        )}

        {activeTab === 'rules' && (
          <RulesPage 
            currentUser={currentUser} 
            onNavigateToAdmin={() => navigateTo('admin')} 
          />
        )}

        {activeTab === 'smartlab' && (
          <AboutSmartlabPage 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'contact' && (
          <ContactInquiryPage
            currentUser={currentUser}
            onOpenLogin={() => navigateTo('login')}
          />
        )}

        {activeTab === 'injury' && <InjuryEncyclopediaPage currentUser={currentUser} />}

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

        {activeTab === 'messages' && (
          <MessagesPage
            currentUser={currentUser}
            onOpenLogin={() => navigateTo('login')}
            onOpenSuggestions={() => navigateTo('suggestions')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConsolePage
            matches={matches}
            notices={notices}
            auditLogs={auditLogs}
            inquiries={inquiries}
            festivalConfig={festivalConfig}
            currentUser={currentUser}
            onNavigateToTab={(t) => navigateTo(t as any)}
          />
        )}

        {activeTab === 'roledashboard' && (
          <RoleDashboardPage
            currentUser={currentUser}
            matches={matches}
            notices={notices}
            onBackToHome={() => navigateTo('home')}
            onNavigateToTab={(t) => navigateTo(t as any)}
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
              onBack={() => navigateTo('schedule')}
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

        {/* DEDICATED WEATHER DETAILS PAGE */}
        {activeTab === 'weather' && (
           <WeatherDetailPage
             weather={weather}
             refreshing={weatherRefreshing}
             onRefresh={refetchWeather}
             onBack={() => navigateTo('home')}
           />
        )}

        {/* HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Special Role Quick Banner for authorized personnel */}
            {currentUser && currentUser.role !== 'student' && (
              <div className="p-3.5 bg-red-50/80 dark:bg-slate-900 border border-red-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    currentUser.role === 'admin' ? 'bg-red-600 text-white' :
                    currentUser.role === 'student_council' ? 'bg-blue-600 text-white' :
                    currentUser.role === 'class_president' ? 'bg-emerald-600 text-white' :
                    currentUser.role === 'teacher' ? 'bg-purple-600 text-white' :
                    currentUser.role === 'referee' ? 'bg-amber-600 text-white' :
                    currentUser.role === 'health_officer' ? 'bg-rose-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {currentUser.role === 'admin' ? '총괄 관리자' :
                     currentUser.role === 'student_council' ? '학생회 / 체육부' :
                     currentUser.role === 'class_president' ? '학급 반장' :
                     currentUser.role === 'teacher' ? '선생님 (지도교사)' :
                     currentUser.role === 'referee' ? '공식 심판 · 기록원' :
                     currentUser.role === 'health_officer' ? '보건 담당' : '특수 권한'}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    <strong>{currentUser.name}</strong> ({currentUser.role === 'admin' ? '총괄본부' : currentUser.role === 'teacher' ? '교원(교사)' : currentUser.role === 'referee' ? '심판진' : `${currentUser.grade}-${currentUser.classNum}`}) 계정으로 인증되었습니다.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser.role === 'admin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo('admin')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        어드민 콘솔 열기
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('roledashboard')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        직무별 대시보드
                      </button>
                    </>
                  )}
                  {currentUser.role === 'class_president' && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo('roledashboard')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        학급 반장 전용 대시보드
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('formation')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        라인업 제출
                      </button>
                    </>
                  )}
                  {(currentUser.role === 'student_council' || currentUser.role === 'referee') && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo('roledashboard')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        학생회 / 진행 대시보드
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentLiveMatch) {
                            setActiveMatchForLive(currentLiveMatch);
                            navigateTo('live');
                          } else {
                            navigateTo('schedule');
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        스코어보드 제어 (+1/-1)
                      </button>
                    </>
                  )}
                  {currentUser.role === 'health_officer' && (
                    <button
                      type="button"
                      onClick={() => navigateTo('roledashboard')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                    >
                      의무실 전용 대시보드
                    </button>
                  )}
                  {currentUser.role === 'teacher' && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo('schedule')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        학급 대진 및 경기 참관
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('roledashboard')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        직무별 대시보드
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 3-Column Layout Matching Reference Design (image.png) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Weather Card, Safety Guide Sidebar & Today's Schedule */}
              <div className="lg:col-span-3 space-y-5">
                <WeatherWidget
                  variant="card"
                  onOpenDetails={() => navigateTo('weather')}
                />

                <SafetyGuideCard onOpenInjuryEncyclopedia={() => navigateTo('injury')} />

                <TodayScheduleCard
                  matches={matches}
                  userReminders={userReminders}
                  currentUser={currentUser}
                  onToggleReminder={handleToggleReminder}
                  onToggleAllReminders={handleToggleAllTodayReminders}
                  onRequireLogin={() => navigateTo('login')}
                  onViewAll={() => navigateTo('schedule')}
                  onSelectMatch={(m) => {
                    setActiveMatchForLive(m);
                    navigateTo('live');
                  }}
                />
              </div>

              {/* Center Column: Live Match Hero & Tournament Summary */}
              <div className="lg:col-span-6 space-y-5">
                <LiveMatchHeroCard
                  match={currentLiveMatch}
                  currentUser={currentUser}
                  onOpenLiveScore={() => {
                    if (currentLiveMatch) {
                      setActiveMatchForLive(currentLiveMatch);
                      navigateTo('live');
                    }
                  }}
                  onCheerReaction={handleSendReaction}
                  onToggleReminder={handleToggleReminder}
                  isReminderSet={currentLiveMatch ? userReminders.includes(currentLiveMatch.id) : false}
                />

                <TournamentSummaryCard
                  matches={matches}
                  selectedSport={selectedSport}
                  onSelectSport={setSelectedSport}
                  onOpenFullBracket={() => navigateTo('schedule')}
                />
              </div>

              {/* Right Column: Class Leaderboard & Live Cheers Feed */}
              <div className="lg:col-span-3 space-y-5">
                <ClassLeaderboardCard
                  standings={calculatedStandings as any}
                  onOpenFullStandings={() => navigateTo('standings')}
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
      </main>

      {/* 4. Footer with made by SMARTLAB */}
      <Footer links={footerLinks} customCredit="made by SMARTLAB" />

      {/* 5. Mobile Bottom Navigation (Only when logged in) */}
      {currentUser && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={navigateTo}
          userProfile={currentUser}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          isMenuOpen={isMobileMenuOpen}
          activeRemindersCount={userReminders.length}
        />
      )}

      {/* 6. Mobile Slide-Over Menu Drawer (≡ 버튼) */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        matches={matches}
        userReminders={userReminders}
        onToggleReminder={handleToggleReminder}
        suggestions={inquiries}
        onNavigateToTab={(tab) => {
          navigateTo(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenSuggestionModal={() => {
          if (!currentUser) {
            navigateTo('login');
          } else {
            setShowSuggestionModal(true);
          }
        }}
        onLogout={handleLogout}
      />

      {/* 7. Notice Popup Modal (가장 최근 공지만 단일 표시) */}
      {selectedNoticeForPopup && (
        <NoticeModal
          isOpen={Boolean(selectedNoticeForPopup)}
          notice={selectedNoticeForPopup}
          onClose={() => setSelectedNoticeForPopup(null)}
          onViewAllNotices={() => {
            setSelectedNoticeForPopup(null);
            navigateTo('notices');
          }}
          onDismissToday={() => {
            try {
              const { dateStr } = getKSTNowParts();
              localStorage.setItem('sangsan_hide_notice_date', dateStr);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* 8. Direct Message Modal */}
      {showDirectMessageModal && currentUser && (
        <DirectMessageModal
          currentUser={currentUser}
          isOpen={showDirectMessageModal}
          onClose={() => setShowDirectMessageModal(false)}
        />
      )}

      {/* 9. Suggestion Modal */}
      {showSuggestionModal && currentUser && (
        <SuggestionModal
          currentUser={currentUser}
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
        />
      )}
    </div>
  );
}
