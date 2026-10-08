import React from 'react';
import { AppData } from '../../hooks/useAppData';
import {
  NoticeModal,
  DirectMessageModal,
  SuggestionModal,
  MobileMenuDrawer
} from '../../components';
import { getKSTNowParts } from '../../utils/kstTime';

interface AppModalsProps {
  appData: AppData;
}

export const AppModals: React.FC<AppModalsProps> = ({ appData }) => {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    isDarkMode,
    handleToggleDarkMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    matches,
    userReminders,
    handleToggleReminder,
    inquiries,
    navigateTo,
    setShowSuggestionModal,
    handleLogout,
    selectedNoticeForPopup,
    setSelectedNoticeForPopup,
    showDirectMessageModal,
    setShowDirectMessageModal,
    showSuggestionModal
  } = appData;

  return (
    <>
      {/* 1. Mobile Slide-Over Menu Drawer */}
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

      {/* 2. Notice Popup Modal */}
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

      {/* 3. Direct Message Modal */}
      {showDirectMessageModal && currentUser && (
        <DirectMessageModal
          currentUser={currentUser}
          isOpen={showDirectMessageModal}
          onClose={() => setShowDirectMessageModal(false)}
        />
      )}

      {/* 4. Suggestion Modal */}
      {showSuggestionModal && currentUser && (
        <SuggestionModal
          currentUser={currentUser}
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
        />
      )}
    </>
  );
};
