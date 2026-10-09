import { useState, useEffect, useMemo } from 'react';
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
  SuggestionItem,
  LiveReactionType
} from '../types';
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
  autoStartDueMatches,
  syncCompletedTournamentRounds,
  seedInitialDataIfEmpty
} from '../services/firebaseService';
import { MainNavTab } from '../components/common/Navbar';
import { filterProfanity } from '../utils/profanityFilter';
import { verifySavedSession, createSignedSession } from '../utils/sessionToken';
import { useOpenMeteoWeather } from './useOpenMeteoWeather';
import { registerServiceWorker, checkAndTrigger15MinMatchNotifications } from '../services/notificationService';
import { useOfflineFallback } from './useOfflineFallback';

export function useAppData() {
  // Real-time Weather & Atmospheric Visual Effects
  const { weather, refreshing: weatherRefreshing, refetch: refetchWeather } = useOpenMeteoWeather({
    refreshIntervalMs: 60000
  });

  // 1. Current User state with session signature validation
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSessionRestored, setIsSessionRestored] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');

  // Active Tab Navigation
  const [activeTab, setActiveTabState] = useState<MainNavTab>('login');

  const protectedTabs = useMemo<Set<MainNavTab>>(() => new Set([
    'schedule',
    'bracket',
    'roledashboard',
    'messages',
    'suggestions',
    'injury',
    'settings',
    'contact',
    'admin',
    'formation'
  ]), []);

  const navigateTo = (tab: MainNavTab) => {
    if (protectedTabs.has(tab) && !currentUser) {
      setActiveTabState('login');
      return;
    }
    setActiveTabState(tab);
  };

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sangsan_theme');
      if (savedTheme) return savedTheme === 'dark';
      return document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sangsan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sangsan_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Validate saved session signature on mount
  useEffect(() => {
    let isCancelled = false;
    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem('sangsan_current_user');
        const validProfile = await verifySavedSession(raw);
        if (!isCancelled) {
          if (validProfile) {
            setCurrentUser(validProfile);
            setCurrentRole(validProfile.role);
          } else if (raw) {
            console.warn('[Session] Saved session is invalid or tampered. Discarding session.');
            localStorage.removeItem('sangsan_current_user');
            setCurrentUser(null);
          }
        }
      } catch (e) {
        console.error('[Session Restoration Error]', e);
      } finally {
        if (!isCancelled) setIsSessionRestored(true);
      }
    };
    restoreSession();
    return () => { isCancelled = true; };
  }, []);

  // UI Drawer & Modal States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [showAdminConsoleModal, setShowAdminConsoleModal] = useState(false);
  const [showFormationBuilder, setShowFormationBuilder] = useState(false);
  const [selectedNoticeForPopup, setSelectedNoticeForPopup] = useState<NoticeItem | null>(null);
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false);

  // Firestore Collections State
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [cheersFeed, setCheersFeed] = useState<CheerMessageItem[]>([]);
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig | null>(null);
  const [userReminders, setUserReminders] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [inquiries, setInquiries] = useState<SuggestionItem[]>([]);

  // Selected filter states
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [activeMatchForLive, setActiveMatchForLive] = useState<MatchItem | null>(null);

  // Cheer submission rate limit state
  const [lastCheerTimestamp, setLastCheerTimestamp] = useState<number>(0);
  const [isSubmittingCheer, setIsSubmittingCheer] = useState<boolean>(false);

  // Seed Initial Data
  useEffect(() => {
    seedInitialDataIfEmpty().catch((err) => {
      console.warn('[Firebase Seed Warning]', err);
    });
  }, []);

  // Service Worker Registration
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  // Firestore Real-time Listeners
  useEffect(() => {
    const unsubMatches = listenMatches((updatedMatches) => {
      setMatches(updatedMatches);
      syncCompletedTournamentRounds(updatedMatches).catch((err) => {
        console.warn('[Tournament Round Sync] background auto-sync error:', err);
      });
    });

    const unsubNotices = listenNotices((updatedNotices) => {
      setNotices(updatedNotices);
      if (!hasShownInitialPopup && updatedNotices.length > 0) {
        const importantNotice = updatedNotices.find((n) => n.important);
        if (importantNotice) {
          setSelectedNoticeForPopup(importantNotice);
          setHasShownInitialPopup(true);
        }
      }
    });

    const unsubFestival = listenFestivalConfig((config) => {
      setFestivalConfig(config);
    });

    const unsubCheers = listenCheersFeed((cheers) => {
      setCheersFeed(cheers);
    });

    const unsubAudit = listenAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    const unsubSuggestions = listenSuggestions((items) => {
      setInquiries(items);
    });

    return () => {
      unsubMatches();
      unsubNotices();
      unsubFestival();
      unsubCheers();
      unsubAudit();
      unsubSuggestions();
    };
  }, [hasShownInitialPopup]);

  // Listen to User Reminders
  useEffect(() => {
    if (!currentUser?.studentId) {
      setUserReminders([]);
      return;
    }
    const unsubReminders = listenUserReminders(currentUser.studentId, (items) => {
      setUserReminders(items.map((r) => r.matchId));
    });
    return () => unsubReminders();
  }, [currentUser?.studentId]);

  // 15-minute Match Push Notification Loop
  useEffect(() => {
    if (!currentUser?.studentId || matches.length === 0) return;

    const interval = setInterval(() => {
      checkAndTrigger15MinMatchNotifications(matches, userReminders);
    }, 60000);

    checkAndTrigger15MinMatchNotifications(matches, userReminders);

    return () => clearInterval(interval);
  }, [matches, userReminders, currentUser?.studentId]);

  // Auto-Start Scheduled Matches
  useEffect(() => {
    const checkAutoStart = () => {
      autoStartDueMatches(matches).then((started) => {
        if (started.length > 0) {
          console.log(`[AutoStart] Automatically started ${started.length} match(es) based on schedule.`);
        }
      }).catch((e) => console.warn('[AutoStart] error:', e));
    };

    const interval = setInterval(checkAutoStart, 10000);
    return () => clearInterval(interval);
  }, [matches]);

  // Action Handlers
  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    setCurrentRole(profile.role);
    createSignedSession(profile).then((signed) => {
      localStorage.setItem('sangsan_current_user', JSON.stringify(signed));
    });
    setActiveTabState('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('sangsan_current_user');
    setCurrentUser(null);
    setCurrentRole('student');
    setActiveTabState('login');
  };

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

  const handleSubmitCheerMessage = async (msg: string) => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000;
    if (now - lastCheerTimestamp < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastCheerTimestamp)) / 60000);
      alert(`응원 메시지는 5분 주기로 1회 작성 가능합니다. (${remainingMinutes}분 후 작성 가능)`);
      return;
    }

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

  const handleSendReaction = async (reactionType: LiveReactionType, matchId?: string) => {
    try {
      const targetMatchId = matchId || currentLiveMatch?.id || 'global';
      await sendLiveReaction(targetMatchId, reactionType);
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

    for (let g = 1; g <= 3; g++) {
      for (let c = 1; c <= 12; c++) {
        const classCode = `${g}${String(c).padStart(2, '0')}`;
        classMap[classCode] = { totalPoints: 0, wins: 0, draws: 0, losses: 0, gold: 0, silver: 0 };
      }
    }

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

  // Offline Fallback State Hook
  const offlineFallback = useOfflineFallback({
    matches,
    notices,
    standings: calculatedStandings
  });

  // Currently live or next upcoming match
  const currentLiveMatch = useMemo(() => {
    if (activeMatchForLive) return activeMatchForLive;
    const inProgress = matches.find((m) => m.status === 'LIVE' || m.status === 'PAUSED');
    if (inProgress) return inProgress;
    return matches.find((m) => m.status === 'SCHEDULED') || matches[0] || null;
  }, [matches, activeMatchForLive]);

  // Urgent Notice for Ticker
  const activeNotice = notices.find((n) => n.important) || notices[0] || null;

  return {
    weather,
    weatherRefreshing,
    refetchWeather,
    currentUser,
    isSessionRestored,
    currentRole,
    setCurrentRole,
    activeTab,
    navigateTo,
    isDarkMode,
    setIsDarkMode,
    handleToggleDarkMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    showAuthModal,
    setShowAuthModal,
    showDirectMessageModal,
    setShowDirectMessageModal,
    showSuggestionModal,
    setShowSuggestionModal,
    showInjuryModal,
    setShowInjuryModal,
    showAdminConsoleModal,
    setShowAdminConsoleModal,
    showFormationBuilder,
    setShowFormationBuilder,
    selectedNoticeForPopup,
    setSelectedNoticeForPopup,
    matches,
    setMatches,
    notices,
    cheersFeed,
    festivalConfig,
    userReminders,
    auditLogs,
    inquiries,
    selectedSport,
    setSelectedSport,
    activeMatchForLive,
    setActiveMatchForLive,
    isSubmittingCheer,
    handleLoginSuccess,
    handleLogout,
    handleToggleReminder,
    handleToggleAllTodayReminders,
    handleSubmitCheerMessage,
    handleSendReaction,
    calculatedStandings,
    currentLiveMatch,
    activeNotice,
    offlineFallback
  };
}

export type AppData = ReturnType<typeof useAppData>;
