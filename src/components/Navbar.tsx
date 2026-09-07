import React from 'react';
import { SangsanUser } from '../types';
import { Activity, Shield, User as UserIcon, LogOut, Cloud, ExternalLink } from 'lucide-react';

interface NavbarProps {
  currentUser: SangsanUser | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  isWorkspaceConnected: boolean;
  onOpenWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onTabChange,
  onOpenAuth,
  onLogout,
  isWorkspaceConnected,
  onOpenWorkspace,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-800 text-white rounded">총괄관리자</span>;
      case 'student_council':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-700 text-white rounded">학생회</span>;
      case 'class_president':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-600 text-white rounded">반장</span>;
      case 'teacher':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-700 text-white rounded">선생님</span>;
      case 'health_officer':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-rose-600 text-white rounded">보건담당</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-slate-600 text-slate-100 rounded">학생</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 px-4 py-1.5 border-b border-red-900/40 text-xs flex justify-between items-center">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">상산고등학교 체육대회 및 축제 실시간 통합 운영 시스템</span>
          <span className="text-amber-400 font-semibold px-1.5 py-0.2 bg-amber-950/80 rounded border border-amber-800/60">
            THE SANGSAN
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            1,000 CCU 최적화 가동 중
          </span>
          {isWorkspaceConnected ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              <Cloud className="w-3 h-3" /> Workspace 연동됨
            </span>
          ) : (
            <button
              onClick={onOpenWorkspace}
              className="text-slate-300 hover:text-white underline text-xs"
            >
              Google 연동
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('scoreboard')}>
            <img
              src="https://cdn.kyobit.com/news/photo/202511/2241_2193_3618.png"
              alt="상산고등학교 엠블럼"
              className="w-10 h-10 object-contain drop-shadow-sm rounded"
              onError={(e) => {
                // Fallback shield if image blocked
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif">
                  THE SANGSAN
                </h1>
                <span className="text-xs text-red-400 font-medium">상산고 축제·체육대회</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-none">
                SMARTLAB Real-time Event Operations
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              { id: 'scoreboard', label: '실시간 경기 현황' },
              { id: 'brackets', label: '토너먼트 대진표' },
              { id: 'lineups', label: '학급 라인업' },
              { id: 'notices', label: '공지사항' },
              { id: 'health', label: '부상 지식백과' },
              { id: 'workspace', label: 'Workspace 연동' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentTab === tab.id
                    ? 'bg-red-900/80 text-white font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-100">
                      {currentUser.studentId} {currentUser.name}
                    </span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {currentUser.isTeacher
                      ? '교직원'
                      : `${currentUser.grade}학년 ${currentUser.classNum}반 ${currentUser.studentNum}번`}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition"
              >
                <UserIcon className="w-4 h-4" />
                학번 간편 로그인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Scroller */}
      <div className="md:hidden flex overflow-x-auto px-3 py-2 bg-slate-950 border-t border-slate-800 gap-1.5 text-xs">
        {[
          { id: 'scoreboard', label: '경기 현황' },
          { id: 'brackets', label: '대진표' },
          { id: 'lineups', label: '라인업' },
          { id: 'notices', label: '공지사항' },
          { id: 'health', label: '부상백과' },
          { id: 'workspace', label: 'Workspace' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md font-medium transition ${
              currentTab === tab.id
                ? 'bg-red-900 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
