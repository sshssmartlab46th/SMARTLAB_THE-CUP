import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { getRoleBadgeInfo } from '../utils/studentIdParser';
import { SangsanEmblem } from './SangsanEmblem';
import { 
  Trophy, 
  Users, 
  Bell, 
  HeartPulse, 
  MessageSquareText, 
  LogOut, 
  ChevronDown, 
  ShieldAlert, 
  Sparkles,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onRoleChange: (newRole: UserRole) => void;
  onOpenAdminPortal: () => void;
}

export function Navbar({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  onRoleChange,
  onOpenAdminPortal
}: NavbarProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const badge = getRoleBadgeInfo(user.role);

  const tabs = [
    { id: 'matches', label: '실시간 경기 전광판', icon: Trophy },
    { id: 'lineups', label: '반별 라인업 제출', icon: Users },
    { id: 'notices', label: '공지사항 & 쪽지함', icon: Bell },
    { id: 'injuries', label: '상산 보건백과', icon: HeartPulse },
    { id: 'suggestions', label: '건의함 & 감사로그', icon: MessageSquareText },
  ];

  const availableRoles: { role: UserRole; name: string }[] = [
    { role: 'student', name: '일반 학생' },
    { role: 'class_president', name: '반장 (라인업 제출자)' },
    { role: 'teacher', name: '담임 선생님' },
    { role: 'student_council', name: '학생회 (심판/공지)' },
    { role: 'health_officer', name: '보건 담당 (백과 관리)' },
    { role: 'admin', name: '총괄 관리자 (sshsgym)' }
  ];

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Branding & User Profile Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <SangsanEmblem size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-white text-base tracking-wider">
                THE SANGSAN
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 font-bold border border-red-800/60 hidden sm:inline-block">
                1981 CHS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              상산고등학교 체육대회·축제 공식 실시간 통합 플랫폼
            </p>
          </div>
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for Test & Delegation */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.bgColor} ${badge.color} transition hover:opacity-90`}
            >
              <span>{badge.label}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn text-xs">
                <div className="px-2.5 py-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-800/80 mb-1">
                  역할 전환 (권한 시뮬레이션)
                </div>
                {availableRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      onRoleChange(r.role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                      user.role === r.role ? 'bg-red-950/80 text-red-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r.name}</span>
                    {user.role === r.role && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Display Name: [학번] [이름] */}
          <div className="text-right hidden sm:block">
            <span className="font-mono font-bold text-xs text-white">
              {user.studentId} {user.name}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              {user.grade === '본부' ? '대회총괄본부' : `${user.grade}학년 ${user.classNum}반`}
            </span>
          </div>

          {/* Admin Tools Button */}
          {user.role === 'admin' && (
            <button
              onClick={onOpenAdminPortal}
              title="관리자 설정 포털"
              className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 hover:bg-amber-900/60 transition"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            title="로그아웃"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <nav className="max-w-6xl mx-auto px-2 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? 'border-red-600 text-white bg-red-950/30 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
