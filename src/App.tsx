import React from 'react';
import { useAppData } from './hooks/useAppData';
import { Navbar, NoticeTickerBanner, WeatherAtmosphereOverlay, Footer, MobileBottomNav } from './components';
import { AppEmergencyLockout } from './components/app/AppEmergencyLockout';
import { AppMainContent } from './components/app/AppMainContent';
import { AppModals } from './components/app/AppModals';

export default function App() {
  const appData = useAppData();

  const {
    weather,
    currentUser,
    currentRole,
    setCurrentRole,
    activeTab,
    navigateTo,
    isDarkMode,
    handleToggleDarkMode,
    setIsMobileMenuOpen,
    festivalConfig,
    activeNotice,
    setSelectedNoticeForPopup,
    userReminders,
    handleLogout,
    offlineFallback
  } = appData;

  // Emergency lockdown check
  if (festivalConfig && festivalConfig.isOpen === false && currentRole !== 'admin') {
    return (
      <AppEmergencyLockout
        festivalConfig={festivalConfig}
        onNavigateToLogin={() => navigateTo('login')}
      />
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
        isFallbackActive={offlineFallback.isFallbackActive}
        onToggleFallback={offlineFallback.toggleManualFallback}
      />

      {/* 2. Notice Ticker with Click-to-Popup */}
      {activeNotice && (
        <NoticeTickerBanner
          notice={activeNotice}
          onClick={() => setSelectedNoticeForPopup(activeNotice)}
        />
      )}

      {/* 3. Main Content Rendering */}
      <AppMainContent appData={appData} />

      {/* 4. Footer with made by SMARTLAB */}
      <Footer links={footerLinks} customCredit="made by SMARTLAB" />

      {/* 5. Mobile Bottom Navigation (Only when logged in) */}
      {currentUser && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={navigateTo}
          userProfile={currentUser}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          isMenuOpen={appData.isMobileMenuOpen}
          activeRemindersCount={userReminders.length}
        />
      )}

      {/* 6. Top-level Modals & Drawers */}
      <AppModals appData={appData} />
    </div>
  );
}
