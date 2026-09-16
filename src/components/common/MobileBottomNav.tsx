import React from 'react';
import { MainNavTab } from './Navbar';
import { Home, Bell, Calendar, Trophy, Activity, Award, MessageSquare } from 'lucide-react';
import { UserProfile } from '../../types';

interface MobileBottomNavProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  userProfile?: UserProfile | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  userProfile
}) => {
  const navItems = [
    { tab: 'home' as MainNavTab, label: '홈', icon: Home },
    { tab: 'notices' as MainNavTab, label: '공지', icon: Bell },
    { tab: 'bracket' as MainNavTab, label: '대진표', icon: Trophy },
    { tab: 'schedule' as MainNavTab, label: '일정', icon: Calendar },
    { tab: 'live' as MainNavTab, label: '실시간', icon: Activity },
    { tab: 'standings' as MainNavTab, label: '순위', icon: Award },
    { tab: 'messages' as MainNavTab, label: '쪽지', icon: MessageSquare }
  ];

  return (
    <nav 
      aria-label="모바일 하단 네비게이션"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg safe-area-inset-bottom"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onTabChange(item.tab)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[50px] ${
              isActive
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-red-50 dark:bg-red-950/50' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
