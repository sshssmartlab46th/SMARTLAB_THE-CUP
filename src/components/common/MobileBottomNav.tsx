import React from 'react';
import { MainNavTab } from './Navbar';
import { Home, Calendar, Activity, Award, Bell } from 'lucide-react';
import { UserProfile, hasUserRole } from '../../types';

interface MobileBottomNavProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  userProfile?: UserProfile | null;
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
  activeRemindersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  userProfile,
  onOpenMenu,
  isMenuOpen = false,
  activeRemindersCount = 0
}) => {
  const isAdmin = hasUserRole(userProfile, 'admin');

  const navItems = [
    { tab: 'home' as MainNavTab, label: '홈', icon: Home },
    { tab: 'schedule' as MainNavTab, label: '경기 일정', icon: Calendar },
    { tab: 'live' as MainNavTab, label: '실시간', icon: Activity },
    { tab: 'standings' as MainNavTab, label: '순위', icon: Award }
  ];

  return (
    <nav 
      aria-label="모바일 하단 네비게이션"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1 flex items-center justify-around shadow-lg safe-area-inset-bottom select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !isMenuOpen && (activeTab === item.tab || (item.tab === 'schedule' && activeTab === 'bracket'));
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onTabChange(item.tab)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              isActive
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-red-50 dark:bg-red-950/50' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
          </button>
        );
      })}

      {/* ≡ Special Mobile Menu Tab (어드민, 알람, 의견란, 설정 등) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] relative ${
          isMenuOpen
            ? 'text-red-600 dark:text-red-400 font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:text-red-600'
        }`}
        title="전체 메뉴 및 어드민·알람·의견란·설정"
      >
        <div className={`p-1 rounded-lg flex items-center justify-center ${
          isMenuOpen ? 'bg-red-50 dark:bg-red-950/50' : ''
        }`}>
          <span className="font-mono text-base font-black leading-none tracking-tighter">≡</span>
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-bold">
          {isAdmin ? '관리 ≡' : '메뉴 ≡'}
        </span>

        {/* Active badges (e.g. reminders or admin) */}
        {activeRemindersCount > 0 && (
          <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>
    </nav>
  );
};
