import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, MatchItem } from './types';
import { parseStudentId } from './utils/studentIdParser';
import { 
  seedInitialDataIfEmpty, 
  listenMatches, 
  syncUserProfile 
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LiveMatchesView } from './components/LiveMatchesView';
import { LineupManagerView } from './components/LineupManagerView';
import { NoticesView } from './components/NoticesView';
import { InjuryEncyclopediaView } from './components/InjuryEncyclopediaView';
import { SuggestionsAndAuditView } from './components/SuggestionsAndAuditView';
import { AdminPortalModal } from './components/AdminPortalModal';
import { SangsanEmblem } from './components/SangsanEmblem';
import { Radio, ShieldAlert } from 'lucide-react';

// Default initial student demo profile for immediate viewing
const DEFAULT_STUDENT_PROFILE: UserProfile = {
  uid: 'demo-20305',
  studentId: '20305',
  name: '김민준',
  role: 'class_president',
  grade: '2',
  classNum: '03',
  studentNum: '05',
  gender: 'male',
  isTeacher: false,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString()
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('the_sangsan_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_STUDENT_PROFILE;
      }
    }
    return DEFAULT_STUDENT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<string>('matches');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Initialize Firebase & seed on first load
  useEffect(() => {
    seedInitialDataIfEmpty();

    const unsubMatches = listenMatches((loadedMatches) => {
      setMatches(loadedMatches);
    });

    return () => {
      unsubMatches();
    };
  }, []);

  const handleRoleChange = async (newRole: UserRole) => {
    const updated: UserProfile = {
      ...currentUser,
      role: newRole
    };
    setCurrentUser(updated);
    localStorage.setItem('the_sangsan_session', JSON.stringify(updated));
    await syncUserProfile(updated);
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('the_sangsan_session');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Authoritative Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
        onOpenAdminPortal={() => setShowAdminPortal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'matches' && (
          <LiveMatchesView matches={matches} currentUser={currentUser} />
        )}

        {activeTab === 'lineups' && (
          <LineupManagerView currentUser={currentUser} />
        )}

        {activeTab === 'notices' && (
          <NoticesView currentUser={currentUser} />
        )}

        {activeTab === 'injuries' && (
          <InjuryEncyclopediaView currentUser={currentUser} />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsAndAuditView currentUser={currentUser} />
        )}
      </main>

      {/* Mandatory Official Sangsan High School Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2">
          <SangsanEmblem size={22} />
          <span className="font-serif font-black text-xs text-slate-400 tracking-wider">
            THE SANGSAN • 상산고등학교 체육대회 및 축제
          </span>
        </div>
        <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
          본 플랫폼은 상산고등학교 자치위원회 및 체육부의 주관 하에 운영되며, 모든 스코어 및 경기 기록은 공인 감사 엔진을 통해 보호됩니다.
        </p>
        <div className="text-[11px] font-mono text-slate-600 tracking-wider pt-1">
          made by SMARTLAB
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={handleAuthSuccess}
        onClose={() => setShowAuthModal(false)}
      />

      <AdminPortalModal
        isOpen={showAdminPortal}
        onClose={() => setShowAdminPortal(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
