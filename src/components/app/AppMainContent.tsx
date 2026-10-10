import React from 'react';
import { AppData } from '../../hooks/useAppData';
import { OfflineFallbackPage } from '../pages/OfflineFallbackPage';
import {
  LoginPage,
  NoticesPage,
  MatchSchedulePage,
  PrivacyPage,
  RulesPage,
  AboutSmartlabPage,
  ContactInquiryPage,
  InjuryEncyclopediaPage,
  SuggestionBoxPage,
  SettingsPage,
  FormationInputPage,
  MessagesPage,
  AdminConsolePage,
  RoleDashboardPage,
  LiveMatchStatusView,
  StandingsView,
  WeatherDetailPage,
  DisplayBoardPage,
  WeatherWidget,
  SafetyGuideCard,
  TodayScheduleCard,
  LiveMatchHeroCard,
  TournamentSummaryCard,
  ClassLeaderboardCard,
  LiveCheersFeedCard
} from '../../components';

interface AppMainContentProps {
  appData: AppData;
}

export const AppMainContent: React.FC<AppMainContentProps> = ({ appData }) => {
  const {
    activeTab,
    navigateTo,
    currentUser,
    handleLoginSuccess,
    notices,
    setSelectedNoticeForPopup,
    matches,
    setMatches,
    selectedSport,
    setSelectedSport,
    userReminders,
    handleToggleReminder,
    setActiveMatchForLive,
    inquiries,
    currentRole,
    setCurrentRole,
    isDarkMode,
    setIsDarkMode,
    auditLogs,
    festivalConfig,
    currentLiveMatch,
    calculatedStandings,
    weather,
    weatherRefreshing,
    refetchWeather,
    handleToggleAllTodayReminders,
    handleSendReaction,
    cheersFeed,
    isSubmittingCheer,
    handleSubmitCheerMessage,
    offlineFallback
  } = appData;

  // Render Offline Fallback Page if tab is fallback or if offline fallback mode is triggered
  if (activeTab === 'fallback' || offlineFallback.isFallbackActive) {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-6">
        <OfflineFallbackPage
          snapshot={offlineFallback.snapshot}
          onRetryConnection={offlineFallback.retryConnection}
          onExitFallbackMode={() => offlineFallback.setIsManualFallback(false)}
          isOnline={offlineFallback.isOnline}
        />
      </main>
    );
  }

  return (
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
          onUpdateMatches={setMatches}
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

      {/* STADIUM DISPLAY BOARD VIEW (/board) */}
      {activeTab === 'board' && (
        <DisplayBoardPage
          matches={matches}
          standings={calculatedStandings as any}
          cheersFeed={cheersFeed}
          onBack={() => navigateTo('home')}
        />
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

          {/* 3-Column Layout Matching Reference Design */}
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
  );
};
