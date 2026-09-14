import React from 'react';
import { UserProfile, UserRole, WeatherInfo } from '../../types';
import { SangsanLogo } from './SangsanLogo';
import { SmartlabLogo } from './SmartlabLogo';
import { 
  Sun, 
  Moon,
  MessageSquare,
  HelpCircle,
  Activity,
  LogOut,
  Settings
} from 'lucide-react';

export type MainNavTab = 'home' | 'bracket' | 'live' | 'standings';

export interface NavbarProps {
  currentRole: UserRole;
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onRoleChange: (role: UserRole) => void;
  userProfile?: UserProfile | null;
  weather?: WeatherInfo | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMessages?: () => void;
  onOpenSuggestions?: () => void;
  onOpenInjuries?: () => void;
  onOpenAdminConsole?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onRoleChange,
  userProfile,
  weather = { temp: 21, condition: '맑음', rainProb: 10 },
  isDarkMode,
  onToggleDarkMode,
  onOpenMessages,
  onOpenSuggestions,
  onOpenInjuries,
  onOpenAdminConsole,
  onLogout
}) => {
  const isDashboardRole = currentRole !== 'student';

  const getRoleHeaderInfo = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: 'SYSTEM ADMINISTRATOR (총괄 관리자)',
          badgeColor: 'bg-red-600 text-white font-bold',
          scope: '접근 권한: 전체 시스템 제어 & 전교 데이터',
          lastActive: '실시간 연결'
        };
      case 'class_president':
        return {
          title: 'CLASS LEADER (학급 반대표)',
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          scope: userProfile?.grade && userProfile?.classNum
            ? `접근 권한: ${userProfile.grade}학년 ${userProfile.classNum}반 전용 채널`
            : '접근 권한: 소속 학급 전용 채널',
          lastActive: '실시간 연결'
        };
      case 'student_council':
        return {
          title: 'STUDENT COUNCIL & SPORTS COMMITTEE (학생회 / 체육부)',
          badgeColor: 'bg-amber-600 text-white font-bold',
          scope: '접근 권한: 대회 현장 운영 & 자원 배치',
          lastActive: '실시간 연결'
        };
      case 'teacher':
        return {
          title: 'MATCH OPERATOR (심판 · 기록원)',
          badgeColor: 'bg-red-600 text-white font-bold',
          scope: '경기 권한: 배정 경기 득점 및 로스터 제어',
          lastActive: '실시간 연결'
        };
      case 'health_officer':
        return {
          title: 'SAFETY & MEDICAL OFFICER (보건 안전 의무 본부)',
          badgeColor: 'bg-sky-600 text-white font-bold',
          scope: '의무 권한: 전교 부상자 발생 접수, 환자 이송 및 연락 제어',
          lastActive: '실시간 연결'
        };
      default:
        return null;
    }
  };

  const roleInfo = isDashboardRole ? getRoleHeaderInfo(currentRole) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand logo & titles matching design */}
        <div className="flex items-center gap-3 shrink-0">
          <SangsanLogo size={36} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                상산 체육대회
              </span>
              {isDashboardRole && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  대시보드
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {isDashboardRole ? '상산고등학교 스마트 운영 시스템' : '상산고등학교 스마트 보드'}
            </p>
          </div>
        </div>

        {/* Center: Main Nav Tabs (for Student) or Role Pill (for Dashboard) */}
        <div className="hidden md:flex items-center justify-center flex-1">
          {roleInfo ? (
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-3 py-1 rounded-full text-[11px] tracking-wide uppercase ${roleInfo.badgeColor}`}>
                {roleInfo.title}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-medium hidden lg:inline">
                {roleInfo.scope}
              </span>
            </div>
          ) : (
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onTabChange('home')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                  activeTab === 'home'
                    ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                }`}
              >
                종합 홈
              </button>
              <button
                type="button"
                onClick={() => onTabChange('bracket')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                  activeTab === 'bracket'
                    ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                }`}
              >
                대진표
              </button>
              <button
                type="button"
                onClick={() => onTabChange('live')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                  activeTab === 'live'
                    ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                }`}
              >
                실시간 현황
              </button>
              <button
                type="button"
                onClick={() => onTabChange('standings')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                  activeTab === 'standings'
                    ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400'
                }`}
              >
                학급 순위
              </button>
            </nav>
          )}
        </div>

        {/* Right tools: Weather/Activity, Role Selector, Theme toggle & Smartlab Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Weather on Home board or Last Activity on Dashboard */}
          {!isDashboardRole ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{weather?.temp || 21}°C {weather?.condition || '맑음'} (강수 {weather?.rainProb || 10}%)</span>
            </div>
          ) : (
            roleInfo && (
              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
                마지막 활동: {roleInfo.lastActive}
              </span>
            )
          )}

          {/* Quick Shortcuts */}
          {onOpenInjuries && (
            <button
              type="button"
              onClick={onOpenInjuries}
              title="부상백과"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-emerald-400 transition"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}

          {onOpenSuggestions && (
            <button
              type="button"
              onClick={onOpenSuggestions}
              title="건의함"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {onOpenMessages && ['class_president', 'student_council', 'admin', 'teacher'].includes(currentRole) && (
            <button
              type="button"
              onClick={onOpenMessages}
              title="쪽지"
              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Role selector dropdown */}
          <div className="relative">
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-500"
            >
              <option value="student">학생 (홈)</option>
              <option value="class_president">반대표</option>
              <option value="student_council">학생회</option>
              <option value="teacher">교사/심판</option>
              <option value="health_officer">보건담당</option>
              <option value="admin">총괄관리자</option>
            </select>
          </div>

          {/* User profile identifier & Logout */}
          {userProfile && (
            <button
              type="button"
              onClick={onLogout}
              title="로그아웃"
              className="p-1.5 text-slate-400 hover:text-red-500 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Smartlab vector logo */}
          <SmartlabLogo size={24} />
        </div>
      </div>
    </header>
  );
};
