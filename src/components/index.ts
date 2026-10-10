// Common components
export * from './common/SangsanLogo';
export * from './common/SmartlabLogo';
export * from './common/Navbar';
export * from './common/MobileBottomNav';
export * from './common/MobileMenuDrawer';
export * from './common/NoticeTickerBanner';
export * from './common/NoticeModal';
export * from './common/Footer';
export * from './common/WeatherWidget';
export * from './common/WeatherAtmosphereOverlay';
export * from './common/ErrorBoundary';

// Home / Student view components
export * from './home/SafetyGuideCard';
export * from './home/LiveMatchHeroCard';
export * from './home/ClassLeaderboardCard';
export * from './home/TodayScheduleCard';
export * from './home/TournamentSummaryCard';
export * from './home/LiveCheersFeedCard';

// Administrator dashboard components
export * from './dashboard/admin/AdminEmergencyControlCard';
export * from './dashboard/admin/AdminSystemStatusCard';
export * from './dashboard/admin/AdminScoreApprovalCard';
export * from './dashboard/admin/AdminQuickActionsCard';
export * from './dashboard/admin/AdminAuditLogCard';
export * from './dashboard/admin/AdminInquiryListCard';

// Auth, Modals & Advanced Match Components
export * from './auth/AuthModal';
export * from './messages/DirectMessageModal';
export * from './suggestions/SuggestionModal';
export * from './injury/InjuryEncyclopediaModal';
export * from './editor/GoogleDocsEditor';
export * from './lineup/SoccerFormationBuilder';
export * from './matches/MVPVotingModal';
export * from './matches/MatchResultCardModal';
export * from './matches/TournamentBracketView';
export * from './matches/LiveMatchStatusView';
export * from './matches/StandingsView';
export * from './admin/AdminDashboardModal';
export * from './admin/AdminNoticeManagerTab';
export * from './admin/AdminDocumentManagerTab';

// Dedicated Standalone Pages
export * from './pages/LoginPage';
export * from './pages/SchedulePage';
export * from './pages/MatchSchedulePage';
export * from './pages/PrivacyPage';
export * from './pages/RulesPage';
export * from './pages/AboutSmartlabPage';
export * from './pages/ContactInquiryPage';
export * from './pages/InjuryEncyclopediaPage';
export * from './pages/SuggestionBoxPage';
export * from './pages/SettingsPage';
export * from './pages/FormationInputPage';
export * from './pages/AdminConsolePage';
export * from './pages/RoleDashboardPage';
export * from './pages/MessagesPage';
export * from './pages/WeatherDetailPage';
export * from './pages/NoticesPage';

// Project Documentation & Design Specification SSOT (Dead-code reference for AI models)
export * from '../docs/projectSpecification';
