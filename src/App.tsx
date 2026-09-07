import React, { useState, useEffect } from 'react';
import { SangsanUser, Match, AuditLog } from './types';
import { INITIAL_MATCHES } from './data/mockFestivalData';
import { Navbar } from './components/Navbar';
import { ScoreboardView } from './components/ScoreboardView';
import { TournamentBracket } from './components/TournamentBracket';
import { LineupManager } from './components/LineupManager';
import { NoticeBoard } from './components/NoticeBoard';
import { InjuryEncyclopedia } from './components/InjuryEncyclopedia';
import { WorkspaceHub } from './components/WorkspaceHub';
import { AuthModal } from './components/AuthModal';
import { ScoreAuditModal } from './components/ScoreAuditModal';
import { Footer } from './components/Footer';
import { testFirebaseConnection, initAuth, getAccessToken } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SangsanUser | null>({
    uid: 'sshs-demo-20305',
    studentId: '20305',
    name: '김민준',
    grade: 2,
    classNum: 3,
    studentNum: 5,
    gender: 'male',
    isTeacher: false,
    role: 'student',
    createdAt: new Date().toISOString(),
  });

  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'audit-init-1',
      matchId: 'match-soc-1',
      timestamp: '10:14',
      actor: '20101 이민재 (학생회 심판부)',
      action: '골 승인',
      details: '축구 8강 1경기 전반 14분 김준호 득점 인정',
    },
  ]);

  const [currentTab, setCurrentTab] = useState<string>('scoreboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [selectedMatchForAudit, setSelectedMatchForAudit] = useState<string | undefined>(undefined);
  const [isWorkspaceConnected, setIsWorkspaceConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check Firebase and Workspace OAuth status
    testFirebaseConnection().catch(() => {});
    initAuth((user, token) => {
      setIsWorkspaceConnected(!!token);
    });
    getAccessToken().then((tok) => {
      setIsWorkspaceConnected(!!tok);
    });
  }, []);

  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
    );
  };

  const handleAddAuditLog = (log: AuditLog) => {
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleOpenAuditLogs = (matchId: string) => {
    setSelectedMatchForAudit(matchId);
    setIsAuditModalOpen(true);
  };

  const handleLogin = (user: SangsanUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Authoritative Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isWorkspaceConnected={isWorkspaceConnected}
        onOpenWorkspace={() => setCurrentTab('workspace')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'scoreboard' && (
          <ScoreboardView
            matches={matches}
            currentUser={currentUser}
            onUpdateMatch={handleUpdateMatch}
            onAddAuditLog={handleAddAuditLog}
            onOpenAuditLogs={handleOpenAuditLogs}
          />
        )}

        {currentTab === 'brackets' && (
          <TournamentBracket
            matches={matches}
            onSelectMatch={(matchId) => {
              setCurrentTab('scoreboard');
            }}
          />
        )}

        {currentTab === 'lineups' && <LineupManager currentUser={currentUser} />}

        {currentTab === 'notices' && <NoticeBoard currentUser={currentUser} />}

        {currentTab === 'health' && <InjuryEncyclopedia currentUser={currentUser} />}

        {currentTab === 'workspace' && <WorkspaceHub matches={matches} />}
      </main>

      {/* Mandatory Official Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      <ScoreAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={
          selectedMatchForAudit
            ? auditLogs.filter((l) => l.matchId === selectedMatchForAudit)
            : auditLogs
        }
        matchTitle={matches.find((m) => m.id === selectedMatchForAudit)?.title}
      />
    </div>
  );
}
